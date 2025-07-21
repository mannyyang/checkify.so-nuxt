import { stripe, verifyAndSyncStripeCustomer } from '~/server/utils/stripe';
import { getSupabaseAdmin, getSupabaseUser } from '~/server/utils/supabase';
import { sendSuccess, sendError, ErrorCodes, handleError } from '~/server/utils/api-response';

export default defineEventHandler(async (event) => {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Get authenticated user
    const user = await getSupabaseUser(event);

    if (!user.email) {
      sendError(event, ErrorCodes.VALIDATION_ERROR, 'User email is required', 400);
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      sendError(event, ErrorCodes.NOT_FOUND, 'No billing account found. Please subscribe to a plan first.', 404);
    }

    // Verify customer exists in Stripe before creating portal session
    let customerId = profile.stripe_customer_id;
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer was deleted');
      }
    } catch (verifyError) {
      // Customer doesn't exist, sync it
      console.log(`Customer ${customerId} not found, syncing...`);
      customerId = await verifyAndSyncStripeCustomer(user.id, user.email);
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${useRuntimeConfig().public.BASE_URL}/settings`
      // Optional: specify features available in the portal
      // configuration: 'bpc_1234567890' // Use a specific portal configuration ID
    });

    return sendSuccess(event, { url: session.url });
  } catch (error: any) {
    handleError(event, error);
  }
});
