import { stripe, getOrCreateStripeCustomer, supabaseAdmin } from '~/server/utils/stripe';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event);

  if (!user || !user.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  // Get request body
  const { priceId, tier } = await readBody(event);

  if (!priceId || !['pro', 'max'].includes(tier)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid price ID or tier'
    });
  }

  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // Check if user already has an active subscription
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    // Check if user already has an active subscription
    if (profile && profile.subscription_status === 'active' && profile.subscription_tier !== 'free') {
      // User already has an active subscription
      if (profile.subscription_tier === tier) {
        throw createError({
          statusCode: 400,
          statusMessage: `You already have an active ${tier} subscription`
        });
      }

      // If trying to subscribe to a different tier, they should use the update endpoint
      throw createError({
        statusCode: 400,
        statusMessage: 'You already have an active subscription. Please use the billing portal to change your plan.'
      });
    }

    // Check if there are any existing subscriptions for this customer
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (existingSubscriptions.data.length > 0) {
      // Customer has active subscriptions in Stripe that we don't know about
      // This is a data inconsistency that should be resolved
      console.error('Data inconsistency: Customer has active Stripe subscription but not in database', {
        customerId,
        userId: user.id
      });

      throw createError({
        statusCode: 400,
        statusMessage: 'You already have an active subscription. Please contact support if you believe this is an error.'
      });
    }

    // Create checkout session for new subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${useRuntimeConfig().public.BASE_URL}/settings?success=true&tier=${tier}`,
      cancel_url: `${useRuntimeConfig().public.BASE_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id
        }
      }
    });

    return {
      url: session.url
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);

    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create checkout session'
    });
  }
});
