import Stripe from 'stripe';
import { consola } from 'consola';
import { stripe, supabaseAdmin } from '~/server/utils/stripe';

// Update user subscription in database
async function updateUserSubscription (customerId: string, subscription: Stripe.Subscription) {
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const userId = customer.metadata?.supabase_user_id;

  if (!userId) {
    consola.error('No user ID found in customer metadata');
    return;
  }

  // Determine tier from price ID
  let tier: 'free' | 'pro' | 'max' = 'free';
  const priceId = subscription.items.data[0]?.price.id;
  const config = useRuntimeConfig();

  if (priceId === config.public.stripePriceIdPro) {
    tier = 'pro';
  } else if (priceId === config.public.stripePriceIdMax) {
    tier = 'max';
  }

  // Map Stripe status to our status
  let status: 'active' | 'canceled' | 'past_due' | 'trialing' = 'active';
  switch (subscription.status) {
    case 'active':
      status = 'active';
      break;
    case 'canceled':
      status = 'canceled';
      break;
    case 'past_due':
      status = 'past_due';
      break;
    case 'trialing':
      status = 'trialing';
      break;
  }

  // Update user profile
  const updateData: any = {
    subscription_tier: tier,
    subscription_status: status,
    updated_at: new Date().toISOString()
  };

  // Set expiration date for canceled subscriptions
  if (status === 'canceled' && subscription.current_period_end) {
    updateData.subscription_expires_at = new Date(subscription.current_period_end * 1000).toISOString();
  } else {
    updateData.subscription_expires_at = null;
  }

  await supabaseAdmin
    .from('user_profiles')
    .update(updateData)
    .eq('user_id', userId);

  consola.info(`Updated subscription for user ${userId}: ${tier} (${status})`);
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const sig = getHeader(event, 'stripe-signature');
  const body = await readRawBody(event);

  if (!sig || !body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing signature or body'
    });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      sig,
      config.stripeWebhookSecret || ''
    );
  } catch (err) {
    consola.error('Webhook signature verification failed:', err);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid signature'
    });
  }

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          // Retrieve the subscription
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          if (session.customer) {
            await updateUserSubscription(
              session.customer as string,
              subscription
            );
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await updateUserSubscription(subscription.customer as string, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;

        // When subscription is deleted, set user back to free tier
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userId = customer.metadata?.supabase_user_id;

        if (userId) {
          await supabaseAdmin
            .from('user_profiles')
            .update({
              subscription_tier: 'free',
              subscription_status: 'active',
              subscription_expires_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          consola.info(`Subscription deleted for user ${userId}, reverted to free tier`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          await updateUserSubscription(
            subscription.customer as string,
            subscription
          );
        }
        break;
      }

      default:
        consola.info(`Unhandled event type: ${stripeEvent.type}`);
    }
  } catch (error) {
    consola.error('Error processing webhook:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook processing failed'
    });
  }

  return { received: true };
});
