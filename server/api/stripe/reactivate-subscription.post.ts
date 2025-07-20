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
      .select('stripe_customer_id, subscription_tier, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No Stripe customer found'
      });
    }

    if (profile.subscription_status !== 'canceled') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Subscription is not canceled'
      });
    }

    // Get the subscription that's set to cancel
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    const cancelingSubscription = subscriptions.data.find(sub => sub.cancel_at_period_end);

    if (!cancelingSubscription) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No subscription scheduled for cancellation found'
      });
    }

    // Reactivate the subscription by removing the cancellation
    const subscription = await stripe.subscriptions.update(
      cancelingSubscription.id,
      {
        cancel_at_period_end: false
      }
    );

    // Update database to reflect reactivation
    await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_status: 'active',
        subscription_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    return {
      success: true,
      message: `Your ${profile.subscription_tier} subscription has been reactivated.`
    };
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);

    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to reactivate subscription'
    });
  }
});
