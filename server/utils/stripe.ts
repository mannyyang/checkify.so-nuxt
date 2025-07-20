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
    // Verify the customer still exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (!customer.deleted) {
        return profile.stripe_customer_id;
      }
    } catch (error: any) {
      // Customer doesn't exist in Stripe, we'll create a new one
    }
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

// Helper to verify and sync Stripe customer
export async function verifyAndSyncStripeCustomer (userId: string, email: string) {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!profile?.stripe_customer_id) {
    // No Stripe customer ID stored, create one
    return getOrCreateStripeCustomer(userId, email);
  }

  try {
    // Check if customer exists in Stripe
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id);

    if (customer.deleted) {
      // Customer was deleted, create a new one
      const newCustomer = await stripe.customers.create({
        email,
        metadata: {
          supabase_user_id: userId
        }
      });

      // Update the profile with new customer ID
      await supabaseAdmin
        .from('user_profiles')
        .update({ stripe_customer_id: newCustomer.id })
        .eq('user_id', userId);

      return newCustomer.id;
    }

    return profile.stripe_customer_id;
  } catch (error: any) {
    if (error.code === 'resource_missing') {
      // Customer doesn't exist, create a new one
      const newCustomer = await stripe.customers.create({
        email,
        metadata: {
          supabase_user_id: userId
        }
      });

      // Update the profile with new customer ID
      await supabaseAdmin
        .from('user_profiles')
        .update({ stripe_customer_id: newCustomer.id })
        .eq('user_id', userId);

      return newCustomer.id;
    }

    throw error;
  }
}
