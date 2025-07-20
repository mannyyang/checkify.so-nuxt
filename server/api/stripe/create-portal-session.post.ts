import { stripe, supabaseAdmin, verifyAndSyncStripeCustomer } from '~/server/utils/stripe';
import { serverSupabaseUser } from '#supabase/server';

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
    // Get user's Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No billing account found. Please subscribe to a plan first.'
      });
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

    return {
      url: session.url
    };
  } catch (error: any) {
    console.error('Error creating portal session:', error);

    // Re-throw if it's already a Nuxt error
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create billing portal session'
    });
  }
});
