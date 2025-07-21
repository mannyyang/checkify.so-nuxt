import { stripe } from '~/server/utils/stripe';
import { getSupabaseAdmin, getSupabaseUser } from '~/server/utils/supabase';
import { sendSuccess, handleError } from '~/server/utils/api-response';

export default defineEventHandler(async (event) => {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Get authenticated user
    const user = await getSupabaseUser(event);

    // Get user's subscription data
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, subscription_status, subscription_expires_at, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return sendSuccess(event, {
        tier: 'free',
        status: 'active',
        hasStripeCustomer: false
      });
    }

    // If user has a Stripe customer but shows as free tier, check Stripe directly
    if (profile.stripe_customer_id && (!profile.subscription_tier || profile.subscription_tier === 'free')) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          // Active subscription found in Stripe but not in database
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
          await supabaseAdmin
            .from('user_profiles')
            .update({
              subscription_tier: tier,
              subscription_status: subscription.status as any,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          return sendSuccess(event, {
            tier,
            status: subscription.status,
            expiresAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            hasStripeCustomer: true
          });
        }
      } catch (stripeError) {
        // Silently fail - subscription data from database is still valid
      }
    }

    return sendSuccess(event, {
      tier: profile.subscription_tier || 'free',
      status: profile.subscription_status || 'active',
      expiresAt: profile.subscription_expires_at,
      hasStripeCustomer: !!profile.stripe_customer_id
    });
  } catch (error: any) {
    // If user not authenticated or profile not found, return free tier
    if (error?.statusCode === 401 || error?.code === 'PGRST116') {
      return sendSuccess(event, {
        tier: 'free',
        status: 'active',
        hasStripeCustomer: false
      });
    }
    handleError(event, error);
  }
});
