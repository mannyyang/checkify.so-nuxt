import { stripe, supabaseAdmin } from '~/server/utils/stripe';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  try {
    // Get database data
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let stripeData = null;
    let stripeSubscriptions = null;

    if (profile?.stripe_customer_id) {
      try {
        // Get customer from Stripe
        const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
        stripeData = {
          id: customer.id,
          email: customer.email,
          deleted: customer.deleted,
          metadata: customer.metadata
        };

        // Get subscriptions from Stripe
        const subs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          limit: 10
        });

        stripeSubscriptions = subs.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          priceId: sub.items.data[0]?.price.id,
          productId: sub.items.data[0]?.price.product,
          created: new Date(sub.created * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString()
        }));
      } catch (stripeError: any) {
        stripeData = { error: stripeError.message };
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email
      },
      database: {
        profile: profile || null,
        subscription_tier: profile?.subscription_tier || 'none',
        subscription_status: profile?.subscription_status || 'none',
        stripe_customer_id: profile?.stripe_customer_id || 'none'
      },
      stripe: {
        customer: stripeData,
        subscriptions: stripeSubscriptions
      },
      environment: {
        STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO || 'not set',
        STRIPE_PRICE_ID_MAX: process.env.STRIPE_PRICE_ID_MAX || 'not set'
      }
    };
  } catch (error: any) {
    console.error('Debug error:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get debug data'
    });
  }
});
