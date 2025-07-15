import { stripe, getOrCreateStripeCustomer } from '~/server/utils/stripe';
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
    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${useRuntimeConfig().public.BASE_URL}/settings?success=true&tier=${tier}`,
      cancel_url: `${useRuntimeConfig().public.BASE_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id
        }
      }
    });

    return {
      url: session.url
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create checkout session'
    });
  }
});
