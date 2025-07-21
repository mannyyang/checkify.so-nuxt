import { stripe } from '~/server/utils/stripe';
import { getSupabaseAdmin, getSupabaseUser } from '~/server/utils/supabase';
import { sendSuccess, sendError, ErrorCodes, handleError } from '~/server/utils/api-response';

export default defineEventHandler(async (event) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get authenticated user
    const user = await getSupabaseUser(event);

    if (!user) {
      return sendError(event, ErrorCodes.UNAUTHORIZED, 'Unauthorized');
    }
    // Get user's profile with Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      // No Stripe customer, user is on free tier
      return sendSuccess(event, {
        tier: 'free',
        status: 'active',
        synced: true
      });
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, set to free tier
      await supabaseAdmin
        .from('user_profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'active',
          subscription_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      return sendSuccess(event, {
        tier: 'free',
        status: 'active',
        synced: true
      });
    }

    // Get the active subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;

    // Determine tier from price ID
    let tier: 'free' | 'pro' | 'max' = 'free';
    const stripePriceIdPro = process.env.STRIPE_PRICE_ID_PRO;
    const stripePriceIdMax = process.env.STRIPE_PRICE_ID_MAX;

    console.log('Sync subscription - Price ID check:', {
      priceId,
      stripePriceIdPro,
      stripePriceIdMax,
      matchesPro: priceId === stripePriceIdPro,
      matchesMax: priceId === stripePriceIdMax
    });

    if (priceId === stripePriceIdPro) {
      tier = 'pro';
    } else if (priceId === stripePriceIdMax) {
      tier = 'max';
    } else {
      console.warn(`Sync: Unknown price ID: ${priceId}`);
    }

    // Update the database
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        subscription_status: subscription.status as any,
        subscription_expires_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return sendSuccess(event, {
      tier,
      status: subscription.status,
      priceId,
      synced: true
    });
  } catch (error: any) {
    return handleError(event, error, 'sync subscription');
  }
});
