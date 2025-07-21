import { stripe, getOrCreateStripeCustomer } from '~/server/utils/stripe';
import { getSupabaseAdmin, getSupabaseUser } from '~/server/utils/supabase';
import { sendSuccess, sendError, ErrorCodes, handleError } from '~/server/utils/api-response';

export default defineEventHandler(async (event) => {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Get authenticated user
    const user = await getSupabaseUser(event);

    if (!user.email) {
      sendError(event, ErrorCodes.VALIDATION_ERROR, 'User email is required', 400);
    }

    // Get request body
    const { priceId, tier } = await readBody(event);

    if (!priceId || !['pro', 'max'].includes(tier)) {
      sendError(event, ErrorCodes.INVALID_INPUT, 'Invalid price ID or tier', 400);
    }

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
        sendError(event, ErrorCodes.ALREADY_EXISTS, `You already have an active ${tier} subscription`, 400);
      }

      // If trying to subscribe to a different tier, they should use the update endpoint
      sendError(event, ErrorCodes.VALIDATION_ERROR, 'You already have an active subscription. Please use the billing portal to change your plan.', 400);
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

      sendError(event, ErrorCodes.VALIDATION_ERROR, 'You already have an active subscription. Please contact support if you believe this is an error.', 400);
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

    return sendSuccess(event, { url: session.url });
  } catch (error: any) {
    handleError(event, error);
  }
});
