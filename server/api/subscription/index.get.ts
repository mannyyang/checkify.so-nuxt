import { serverSupabaseUser } from '#supabase/server';
import { supabaseAdmin } from '~/server/utils/stripe';

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
