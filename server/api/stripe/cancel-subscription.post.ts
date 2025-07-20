import { stripe, supabaseAdmin } from '~/server/utils/stripe';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  try {
    // Get user's profile with Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id, subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No Stripe customer found'
      });
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No active subscription found'
      });
    }

    // Cancel the subscription at period end (user keeps access until end of billing period)
    const subscription = await stripe.subscriptions.update(
      subscriptions.data[0].id,
      {
        cancel_at_period_end: true
      }
    );

    // Update database to reflect cancellation
    await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_status: 'canceled',
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    return {
      success: true,
      message: `Your ${profile.subscription_tier} subscription will be canceled at the end of the current billing period.`,
      expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
    };
  } catch (error: any) {
    console.error('Error canceling subscription:', error);

    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to cancel subscription'
    });
  }
});
