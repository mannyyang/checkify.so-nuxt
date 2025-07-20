import { serverSupabaseUser } from '#supabase/server';
import { supabaseAdmin, stripe } from '~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event);

  if (!user) {
    // Return free tier for unauthenticated users
    return {
      tier: 'free',
      status: 'active',
      hasStripeCustomer: false
    };
  }

  try {
    // Get user's subscription data
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, subscription_status, subscription_expires_at, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      // If no profile exists, return free tier
      return {
        tier: 'free',
        status: 'active',
        hasStripeCustomer: false
      };
    }

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
            stripePriceIdMax
          });

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

          return {
            tier,
            status: subscription.status,
            expiresAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            hasStripeCustomer: true
          };
        }
      } catch (stripeError) {
        console.error('Failed to check Stripe subscriptions:', stripeError);
      }
    }

    return {
      tier: profile.subscription_tier || 'free',
      status: profile.subscription_status || 'active',
      expiresAt: profile.subscription_expires_at,
      hasStripeCustomer: !!profile.stripe_customer_id
    };
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscription data'
    });
  }
});
