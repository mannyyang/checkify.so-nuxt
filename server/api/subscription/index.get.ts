import { stripe } from '~/server/utils/stripe';
import { getSupabaseAdmin, getSupabaseUser, withSupabaseError } from '~/server/utils/supabase';
import { sendSuccess, handleError } from '~/server/utils/api-response';

export default defineEventHandler(async (event) => {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Get authenticated user
    const user = await getSupabaseUser(event);

    // Get user's subscription data
    const profile = await withSupabaseError(event, () =>
      supabaseAdmin
        .from('user_profiles')
        .select('subscription_tier, subscription_status, subscription_expires_at, stripe_customer_id')
        .eq('user_id', user.id)
        .single()
    );

    // Log the profile data for debugging
    console.log(`Subscription data for user ${user.id}:`, {
      tier: profile.subscription_tier,
      status: profile.subscription_status,
      stripe_customer_id: profile.stripe_customer_id
    });

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

          console.log('Syncing subscription from Stripe:', {
            priceId,
            stripePriceIdPro,
            stripePriceIdMax,
            priceIdMatchesPro: priceId === stripePriceIdPro,
            priceIdMatchesMax: priceId === stripePriceIdMax
          });

          if (priceId === stripePriceIdPro) {
            tier = 'pro';
          } else if (priceId === stripePriceIdMax) {
            tier = 'max';
          } else {
            console.warn(`Unknown price ID: ${priceId}. Pro: ${stripePriceIdPro}, Max: ${stripePriceIdMax}`);
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
        console.error('Failed to check Stripe subscriptions:', stripeError);
      }
    }

    return sendSuccess(event, {
      tier: profile.subscription_tier || 'free',
      status: profile.subscription_status || 'active',
      expiresAt: profile.subscription_expires_at,
      hasStripeCustomer: !!profile.stripe_customer_id
    });
  } catch (error) {
    // If user not authenticated or profile not found, return free tier
    if (error?.statusCode === 401 || error?.statusCode === 404) {
      return sendSuccess(event, {
        tier: 'free',
        status: 'active',
        hasStripeCustomer: false
      });
    }
    handleError(event, error);
  }
});
