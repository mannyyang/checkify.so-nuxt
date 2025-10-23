# Domain Model: U5 - Subscription & Billing

## Overview
Stripe-powered subscription management with three tiers (Free, Pro, Max) and automated billing.

**Related User Stories:** See `planning/units/U5_subscription_billing.md`

---

## Subscription Tiers

**Source:** `lib/pricing.ts` lines 26-42

```typescript
const TIER_LIMITS = {
  free: {
    maxPages: 25,
    maxCheckboxesPerPage: 25,
    maxTodoLists: 2
  },
  pro: {
    maxPages: 100,
    maxCheckboxesPerPage: 100,
    maxTodoLists: 10
  },
  max: {
    maxPages: 500,
    maxCheckboxesPerPage: 1000,
    maxTodoLists: 25
  }
}
```

---

## Domain Components

### 1. UserProfile (Subscription Fields)

**Table:** `user_profiles`

**Attributes:**
- `user_id` (UUID, FK → auth.users)
- `stripe_customer_id` (TEXT, UNIQUE)
- `subscription_tier` (TEXT: 'free' | 'pro' | 'max')
- `subscription_status` (TEXT: 'active' | 'canceled' | 'past_due' | 'trialing')
- `subscription_expires_at` (TIMESTAMP)

**Note:** No `stripe_subscription_id` stored (differs from original docs)

---

### 2. Tier Detection Service

**Location:** `server/utils/get-user-tier.ts` lines 17-126

**Purpose:** Determines user's subscription tier with fallback logic

**Algorithm:**
```
1. Query user_profiles for tier
2. If tier is 'free' but has stripe_customer_id:
   a. Query Stripe API for actual subscription
   b. Update database if mismatch found
3. Return tier with limits
4. Default to 'free' on errors
```

**Implementation Highlights:**
```typescript
export async function getUserTier(userId: string): Promise<UserTierResult> {
  // Check database first
  const profile = await fetchUserProfile(userId)

  // If shows free but has Stripe customer, verify with Stripe
  if (profile.subscription_tier === 'free' && profile.stripe_customer_id) {
    const stripeSubscription = await fetchStripeSubscription(profile.stripe_customer_id)

    if (stripeSubscription && stripeSubscription.status === 'active') {
      // Sync database with Stripe
      await syncTierFromStripe(userId, stripeSubscription)
    }
  }

  return {
    tier: profile.subscription_tier,
    limits: getTierLimits(profile.subscription_tier)
  }
}
```

---

### 3. Stripe Checkout Service

**Location:** `server/api/stripe/create-checkout-session.post.ts`

**Purpose:** Creates Stripe Checkout session for upgrades

**Request:**
```json
{
  "tier": "pro"  // or "max"
}
```

**Implementation:**
```typescript
export default defineEventHandler(async (event) => {
  const { tier } = await readBody(event)
  const { user } = event.context

  // Get or create Stripe customer
  let customerId = await getStripeCustomerId(user.id)
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id }
    })
    customerId = customer.id
  }

  // Get price ID for tier
  const priceId = tier === 'pro'
    ? process.env.STRIPE_PRICE_ID_PRO
    : process.env.STRIPE_PRICE_ID_MAX

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.BASE_URL}/dashboard?success=true`,
    cancel_url: `${process.env.BASE_URL}/pricing?canceled=true`
  })

  return { data: { url: session.url } }
})
```

---

### 4. Stripe Webhook Handler

**Location:** `server/api/stripe/webhook.post.ts`

**Purpose:** Processes Stripe events for subscription lifecycle

**Supported Events:**
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Status changes
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_failed` - Payment failures

**Implementation:**
```typescript
export default defineEventHandler(async (event) => {
  const signature = getHeader(event, 'stripe-signature')
  const body = await readRawBody(event)

  // Verify webhook signature
  const stripeEvent = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )

  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(stripeEvent.data.object)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(stripeEvent.data.object)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(stripeEvent.data.object)
      break
  }

  return { received: true }
})
```

**Webhook Actions:**
- Update `user_profiles.subscription_tier`
- Update `subscription_status`
- Set `subscription_expires_at` for canceled subs
- Sync customer IDs

---

### 5. Customer Portal Service

**Location:** `server/api/stripe/create-portal-session.post.ts`

**Purpose:** Redirects to Stripe Customer Portal for self-service

**Implementation:**
```typescript
export default defineEventHandler(async (event) => {
  const { user } = event.context
  const customerId = await getStripeCustomerId(user.id)

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.BASE_URL}/dashboard`
  })

  return { data: { url: session.url } }
})
```

---

### 6. SubscriptionStore (Pinia)

**Location:** `stores/subscription.ts`

**State:**
```typescript
{
  subscription: Subscription | null,
  limits: TierLimits | null,
  isLoading: boolean,
  error: string | null
}
```

**Actions:**
- `fetchSubscription()` - Load from `/api/subscription`
- `createCheckoutSession(tier)` - Start upgrade
- `createPortalSession()` - Open billing portal
- `syncSubscription()` - Sync with Stripe

---

## Component Interactions

### Upgrade Flow

```
User clicks "Upgrade to Pro"
  ↓
SubscriptionStore.createCheckoutSession('pro')
  ↓
POST /api/stripe/create-checkout-session { tier: 'pro' }
  ↓
Server:
  1. Get/create Stripe customer
  2. Get price ID from env var
  3. Create checkout session
  4. Return session URL
  ↓
Redirect user to Stripe Checkout
  ↓
User enters payment info
  ↓
Stripe processes payment
  ↓
Redirect to success_url
  ↓
Stripe webhook: checkout.session.completed
  ↓
Webhook handler:
  1. Extract customer & subscription IDs
  2. Determine tier from price ID
  3. Update user_profiles:
     - subscription_tier = 'pro'
     - subscription_status = 'active'
     - stripe_customer_id = customer_id
  ↓
User sees dashboard with Pro tier active
```

### Tier Enforcement

```
User attempts action (create todo list)
  ↓
API endpoint calls getUserTier(userId)
  ↓
Tier service:
  1. Query user_profiles
  2. Check if needs Stripe sync
  3. Return tier + limits
  ↓
Compare: current count >= limit?
  ├─ YES → Return 403 with upgrade prompt
  ↓
  └─ NO → Allow action
```

---

## API Endpoints

### GET /api/subscription

**Response:**
```json
{
  "data": {
    "tier": "pro",
    "status": "active",
    "limits": {
      "maxPages": 100,
      "maxCheckboxesPerPage": 100,
      "maxTodoLists": 10
    }
  }
}
```

### POST /api/stripe/create-checkout-session

**Request:** `{ "tier": "pro" }`
**Response:** `{ "data": { "url": "https://checkout.stripe.com/..." } }`

### POST /api/stripe/create-portal-session

**Response:** `{ "data": { "url": "https://billing.stripe.com/..." } }`

### POST /api/stripe/webhook

**Headers:** `stripe-signature`
**Body:** Stripe event object
**Response:** `{ "received": true }`

---

## Business Rules

1. **Free by Default:** New users start with free tier
2. **Tier Limits Enforced:** Checked before operations
3. **Stripe as Source of Truth:** Webhooks update database
4. **Auto-Sync:** Tier service syncs with Stripe if mismatch
5. **Grace Period:** Canceled subs work until period end

---

## Environment Variables

```
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_MAX=price_...
```

---

## Related Documentation
- User Stories: `planning/units/U5_subscription_billing.md`
- Subscription Tiers: `.claude/features/subscription-tiers.md`
- Stripe Integration: `.claude/features/stripe-integration.md`
