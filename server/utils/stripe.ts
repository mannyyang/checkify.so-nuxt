import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Get runtime config
const config = useRuntimeConfig();

// Initialize Stripe
export const stripe = new Stripe(config.stripeSecretKey || '', {
  apiVersion: '2024-12-18.acacia'
});

// Initialize Supabase with service key (for admin operations)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Helper to get or create Stripe customer
export async function getOrCreateStripeCustomer (userId: string, email: string) {
  // Check if user already has a Stripe customer ID
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId
    }
  });

  // Update user profile with Stripe customer ID
  await supabaseAdmin
    .from('user_profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId);

  return customer.id;
}
