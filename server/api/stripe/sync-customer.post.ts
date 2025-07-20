import { serverSupabaseUser } from '#supabase/server';
import { verifyAndSyncStripeCustomer } from '~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event);

  if (!user || !user.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  try {
    // Verify and sync Stripe customer
    const customerId = await verifyAndSyncStripeCustomer(user.id, user.email);

    return {
      success: true,
      customerId,
      message: 'Stripe customer synced successfully'
    };
  } catch (error: any) {
    console.error('Error syncing Stripe customer:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to sync Stripe customer'
    });
  }
});
