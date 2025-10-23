import { consola } from 'consola';
import { stripe } from '~/server/utils/stripe';
import { getSupabaseAdmin } from '~/server/utils/supabase';
import type { TierName } from '~/lib/pricing';

export interface UserTierResult {
  tier: TierName;
  status: string;
  source: 'database' | 'stripe' | 'default';
  stripeCustomerId?: string;
}

/**
 * Get user's subscription tier with fallback to Stripe if needed
 * This ensures consistent tier detection across all endpoints
 */
export async function getUserTier (userId: string): Promise<UserTierResult> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // First, get user's subscription data from database
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      consola.warn(`Failed to fetch user profile for ${userId}:`, error.message);
      return {
        tier: 'free',
        status: 'active',
        source: 'default'
      };
    }

    if (!profile) {
      consola.warn(`No profile found for user ${userId}`);
      return {
        tier: 'free',
        status: 'active',
        source: 'default'
      };
    }

    // If user has a Stripe customer but shows as free tier, check Stripe directly
    if (profile.stripe_customer_id && (!profile.subscription_tier || profile.subscription_tier === 'free')) {
      consola.info(`User ${userId} has Stripe customer but shows free tier, checking Stripe...`);

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
          let tier: TierName = 'free';
          const stripePriceIdPro = process.env.STRIPE_PRICE_ID_PRO;
          const stripePriceIdMax = process.env.STRIPE_PRICE_ID_MAX;

          if (priceId === stripePriceIdPro) {
            tier = 'pro';
          } else if (priceId === stripePriceIdMax) {
            tier = 'max';
          }

          consola.info(`Found active ${tier} subscription in Stripe for user ${userId}, updating database...`);

          // Update the database
          await supabaseAdmin
            .from('user_profiles')
            .update({
              subscription_tier: tier,
              subscription_status: subscription.status as any,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          return {
            tier,
            status: subscription.status,
            source: 'stripe',
            stripeCustomerId: profile.stripe_customer_id
          };
        }
      } catch (stripeError) {
        consola.error(`Failed to check Stripe for user ${userId}:`, stripeError);
        // Fall through to return database data
      }
    }

    // Validate tier from database
    const dbTier = profile.subscription_tier as TierName;
    if (dbTier && ['free', 'pro', 'max'].includes(dbTier)) {
      consola.info(`Using ${dbTier} tier from database for user ${userId}`);
      return {
        tier: dbTier,
        status: profile.subscription_status || 'active',
        source: 'database',
        stripeCustomerId: profile.stripe_customer_id || undefined
      };
    }

    // Default to free if tier is invalid
    consola.warn(`Invalid tier "${profile.subscription_tier}" for user ${userId}, defaulting to free`);
    return {
      tier: 'free',
      status: profile.subscription_status || 'active',
      source: 'default',
      stripeCustomerId: profile.stripe_customer_id || undefined
    };
  } catch (error) {
    consola.error(`Error getting user tier for ${userId}:`, error);
    return {
      tier: 'free',
      status: 'active',
      source: 'default'
    };
  }
}
