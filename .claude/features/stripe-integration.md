# Stripe Integration

This guide covers the complete Stripe payment integration in Checkify.so, including setup, configuration, and implementation details.

## Overview

Checkify.so uses Stripe for subscription management, providing:
- Secure payment processing
- Subscription lifecycle management
- Automatic billing and invoicing
- Customer portal for self-service
- Webhook-based real-time updates

## Prerequisites

Before setting up Stripe integration, you need:
1. A Stripe account (test mode for development)
2. Products and prices configured in Stripe
3. Webhook endpoint configured
4. Environment variables set

## Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs
STRIPE_PRICE_ID_PRO=price_xxxxx
STRIPE_PRICE_ID_MAX=price_xxxxx
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

In your Stripe dashboard:

1. Navigate to **Products** → **Add product**
2. Create three products:
   - **Free**: $0/month (optional, for tracking)
   - **Pro**: $6.99/month
   - **Max**: $19.99/month

3. For each paid product:
   - Set billing to "Recurring"
   - Set interval to "Monthly"
   - Note the price IDs (format: `price_xxxxx`)

### 2. Configure Webhook Endpoint

1. Navigate to **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copy the webhook signing secret

### 3. Configure Customer Portal

1. Navigate to **Settings** → **Billing** → **Customer portal**
2. Enable features:
   - Update payment methods
   - Cancel subscriptions
   - View invoices
   - Update billing address

## Implementation Details

### Database Schema

The `user_profiles` table stores subscription data:

```sql
CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'max')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  current_period_end timestamp,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Key Components

#### 1. Auto-sync on Login

The `useStripeSync` composable automatically syncs Stripe customer data on user login:

```typescript
// composables/useStripeSync.ts
export const useStripeSync = () => {
  const user = useSupabaseUser();
  
  watch(user, async (newUser) => {
    if (newUser) {
      await $fetch('/api/stripe/sync-customer', {
        method: 'POST'
      });
    }
  }, { immediate: true });
};
```

#### 2. Subscription Management

The `useSubscription` composable provides subscription state and tier limits:

```typescript
// Usage in components
const { subscription, isLoading, tier, canAccessFeature } = useSubscription();

// Check feature access
if (canAccessFeature('webhooks')) {
  // Show webhook configuration
}

// Get tier limits
const limits = TIER_LIMITS[tier];
```

#### 3. Checkout Flow

```typescript
// Create checkout session
const { sessionId } = await $fetch('/api/stripe/create-checkout-session', {
  method: 'POST',
  body: {
    priceId: 'price_xxxxx',
    successUrl: '/success',
    cancelUrl: '/pricing'
  }
});

// Redirect to Stripe
await stripe.redirectToCheckout({ sessionId });
```

#### 4. Billing Portal

```typescript
// Open billing portal
const { url } = await $fetch('/api/stripe/create-portal-session', {
  method: 'POST',
  body: {
    returnUrl: '/settings'
  }
});

window.location.href = url;
```

### Webhook Processing

Webhooks ensure data consistency between Stripe and your database:

```typescript
// server/api/stripe/webhook.post.ts
export default defineEventHandler(async (event) => {
  const sig = getHeader(event, 'stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Verify webhook signature
  const stripeEvent = stripe.webhooks.constructEvent(
    rawBody,
    sig,
    webhookSecret
  );
  
  // Process events
  switch (stripeEvent.type) {
    case 'customer.subscription.updated':
      await updateSubscriptionInDatabase(subscription);
      break;
    // ... handle other events
  }
});
```

### Error Handling

The integration includes comprehensive error handling:

1. **Duplicate Subscription Prevention**: Checks for existing subscriptions before checkout
2. **State Validation**: Ensures database and Stripe data stay in sync
3. **Graceful Failures**: User-friendly error messages for payment failures
4. **Debug Endpoints**: Development tools for troubleshooting

### Security Considerations

1. **Webhook Signature Validation**: All webhooks are verified using Stripe's signature
2. **Row Level Security**: Database policies ensure users can only access their own data
3. **Server-side API Calls**: All Stripe API calls are made server-side
4. **Environment Variables**: Sensitive keys are never exposed to the client

## Testing

### Development Testing

1. Use Stripe test mode
2. Test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`

3. Test webhook events using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### Test Scenarios

1. **New Subscription**: User subscribes to Pro/Max tier
2. **Upgrade**: Free → Pro → Max
3. **Downgrade**: Max → Pro → Free
4. **Cancellation**: Cancel and reactivate before period end
5. **Payment Failure**: Card decline handling
6. **Webhook Processing**: Ensure all events update database

## Common Issues

### Webhook Signature Validation Failed
- Ensure you're using the correct webhook secret
- Check that you're passing the raw request body

### Subscription State Mismatch
- Use the debug endpoint to check both database and Stripe state
- Run sync-subscription endpoint to force reconciliation

### Customer Already Has Active Subscription
- Check for existing subscriptions before creating checkout session
- Redirect to billing portal for plan changes

## Monitoring

### Key Metrics to Track
- Subscription conversion rate
- Churn rate by tier
- Failed payment rate
- Webhook delivery success rate

### Useful Queries

```sql
-- Active subscriptions by tier
SELECT tier, COUNT(*) 
FROM user_profiles 
WHERE status = 'active' 
GROUP BY tier;

-- Recent subscription changes
SELECT email, tier, status, updated_at 
FROM user_profiles 
ORDER BY updated_at DESC 
LIMIT 20;
```

## Future Enhancements

1. **Annual Billing**: Offer discounted annual plans
2. **Trial Periods**: Free trial for new users
3. **Proration**: Handle mid-cycle plan changes
4. **Team Billing**: Multiple users under one subscription
5. **Usage-Based Billing**: Pay per todo or API call