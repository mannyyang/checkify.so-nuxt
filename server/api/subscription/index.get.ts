import { stripe } from '~/server/utils/stripe';
import { getSupabaseAdmin, getSupabaseUser } from '~/server/utils/supabase';
import { sendSuccess, handleError } from '~/server/utils/api-response';
import { getUserTier } from '~/server/utils/get-user-tier';

export default defineEventHandler(async (event) => {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Get authenticated user
    const user = await getSupabaseUser(event);

    // Use shared utility to get tier with Stripe fallback
    const tierResult = await getUserTier(user.id);

    // Get additional profile data for the response
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_status, subscription_expires_at, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    return sendSuccess(event, {
      tier: tierResult.tier,
      status: tierResult.status,
      expiresAt: profile?.subscription_expires_at || null,
      hasStripeCustomer: !!profile?.stripe_customer_id,
      tierSource: tierResult.source // Include source for debugging
    });
  } catch (error: any) {
    // If user not authenticated or profile not found, return free tier
    if (error?.statusCode === 401 || error?.code === 'PGRST116') {
      return sendSuccess(event, {
        tier: 'free',
        status: 'active',
        hasStripeCustomer: false,
        tierSource: 'default'
      });
    }
    handleError(event, error);
  }
});
