import { stripe, supabaseAdmin } from '~/server/utils/stripe';
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

  // Get request body
  const { priceId, tier } = await readBody(event);

  if (!priceId || !['pro', 'max'].includes(tier)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid price ID or tier'
    });
  }

  try {
    // Get user's profile and current subscription
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User profile not found'
      });
    }

    if (!profile.stripe_customer_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No Stripe customer found. Please subscribe first.'
      });
    }

    // Check if user has an active subscription
    if (profile.subscription_status !== 'active' || profile.subscription_tier === 'free') {
      throw createError({
        statusCode: 400,
        statusMessage: 'No active subscription found. Please subscribe first.'
      });
    }

    // Check if trying to update to the same tier
    if (profile.subscription_tier === tier) {
      throw createError({
        statusCode: 400,
        statusMessage: `You already have an active ${tier} subscription`
      });
    }

    // Get current subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No active subscription found in Stripe. Please contact support.'
      });
    }

    const currentSubscription = subscriptions.data[0];
    const currentItem = currentSubscription.items.data[0];

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
      items: [{
        id: currentItem.id,
        price: priceId
      }],
      // Prorate the change immediately
      proration_behavior: 'always_invoice',
      metadata: {
        supabase_user_id: user.id
      }
    });

    // The webhook will handle updating the database, but we'll do it here too for immediate UI feedback
    const updateData: any = {
      subscription_tier: tier,
      updated_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id);

    return {
      success: true,
      subscription: {
        id: updatedSubscription.id,
        tier,
        status: updatedSubscription.status
      }
    };
  } catch (error: any) {
    console.error('Error updating subscription:', error);

    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update subscription'
    });
  }
});
