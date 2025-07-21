import { getSupabaseUser } from '~/server/utils/supabase';
import { verifyAndSyncStripeCustomer } from '~/server/utils/stripe';
import { sendSuccess, sendError, ErrorCodes, handleError } from '~/server/utils/api-response';

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user
    const user = await getSupabaseUser(event);

    if (!user || !user.email) {
      return sendError(event, ErrorCodes.UNAUTHORIZED, 'Unauthorized');
    }
    // Verify and sync Stripe customer
    const customerId = await verifyAndSyncStripeCustomer(user.id, user.email);

    return sendSuccess(event, {
      customerId,
      message: 'Stripe customer synced successfully'
    });
  } catch (error: any) {
    return handleError(event, error, 'sync Stripe customer');
  }
});
