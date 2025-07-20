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
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      // No Stripe customer, user is on free tier
      return {
        tier: 'free',
        status: 'active',
        synced: true
      };
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, set to free tier
      await supabaseAdmin
        .from('user_profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'active',
          subscription_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      return {
        tier: 'free',
        status: 'active',
        synced: true
      };
    }

    // Get the active subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;

    // Determine tier from price ID
    let tier: 'free' | 'pro' | 'max' = 'free';
    const stripePriceIdPro = process.env.STRIPE_PRICE_ID_PRO;
    const stripePriceIdMax = process.env.STRIPE_PRICE_ID_MAX;

    if (priceId === stripePriceIdPro) {
      tier = 'pro';
    } else if (priceId === stripePriceIdMax) {
      tier = 'max';
    }

    // Update the database
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        subscription_status: subscription.status as any,
        subscription_expires_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return {
      tier,
      status: subscription.status,
      priceId,
      synced: true
    };
  } catch (error: any) {
    console.error('Error syncing subscription:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to sync subscription'
    });
  }
});
