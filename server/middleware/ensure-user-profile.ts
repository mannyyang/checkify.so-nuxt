import { serverSupabaseUser } from '#supabase/server';
import { getSupabaseAdmin } from '~/server/utils/supabase';
import { verifyAndSyncStripeCustomer } from '~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  const supabaseAdmin = getSupabaseAdmin();
  // Only run for API routes that need user profiles
  const url = event.node.req.url || '';

  // Skip if not an API route or is a public endpoint
  if (!url.startsWith('/api/') || url.includes('/api/stripe/webhook')) {
    return;
  }

  // Skip auth-related endpoints
  if (url.includes('/api/auth') || url.includes('/api/_content')) {
    return;
  }

  try {
    const user = await serverSupabaseUser(event);

    if (!user || !user.email) {
      return;
    }

    // Check if user has a profile
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile exists, create one
      console.log(`Creating profile for user ${user.id}`);

      const { error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: user.id,
          subscription_tier: 'free',
          subscription_status: 'active'
        });

      if (createError) {
        console.error('Failed to create user profile:', createError);
      } else {
        console.log(`Profile created for user ${user.id}`);

        // Create Stripe customer for new profile
        try {
          await verifyAndSyncStripeCustomer(user.id, user.email);
          console.log(`Stripe customer created for user ${user.id}`);
        } catch (stripeError) {
          console.error('Failed to create Stripe customer:', stripeError);
        }
      }
    } else if (profile) {
      // Profile exists, check if we need to sync Stripe customer
      // Only do this for certain endpoints to avoid too many API calls
      const stripeRelatedEndpoints = ['/api/subscription', '/api/stripe'];
      const shouldCheckStripe = stripeRelatedEndpoints.some(endpoint => url.includes(endpoint));

      if (shouldCheckStripe) {
        try {
          await verifyAndSyncStripeCustomer(user.id, user.email);
        } catch (stripeError) {
          console.error('Failed to verify Stripe customer:', stripeError);
        }
      }
    }
  } catch (error) {
    // Don't block requests if profile check fails
    console.error('Error in ensure-user-profile middleware:', error);
  }
});
