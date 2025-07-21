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
          email: 'email' in customer ? customer.email : 'deleted',
          deleted: customer.deleted,
          metadata: 'metadata' in customer ? customer.metadata : {}
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
          current_period_end: 'current_period_end' in sub && sub.current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null
        }));
      } catch (stripeError: any) {
        stripeData = { error: stripeError.message };
      }
    }

    return sendSuccess(event, {
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
    });
  } catch (error: any) {
    return handleError(event, error);
  }
});
