import { getSupabaseUser } from '~/server/utils/supabase';
import { getUserTier } from '~/server/utils/get-user-tier';
import { sendSuccess, handleError } from '~/server/utils/api-response';
import { getSupabaseAdmin } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  try {
    const user = await getSupabaseUser(event);
    const supabaseAdmin = getSupabaseAdmin();

    // Get tier using our new utility
    const tierResult = await getUserTier(user.id);

    // Get raw database data for comparison
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    return sendSuccess(event, {
      userId: user.id,
      email: user.email,
      tierFromUtility: tierResult,
      rawDatabaseData: profile,
      message: `Your tier is: ${tierResult.tier} (source: ${tierResult.source})`
    });
  } catch (error: any) {
    handleError(event, error);
  }
});
