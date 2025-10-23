# Unit 5: Subscription & Billing

## Epic Overview
Manage subscription tiers (Free, Pro, Max) with Stripe integration for payments and tier limit enforcement.

**Status:** 🟢 Completed
**Priority:** High
**Dependencies:** U1 (User Authentication)

---

## User Stories

### U5-S1: Free Tier by Default
**As a** new user
**I want to** start with a free tier
**So that** I can try the service before paying

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] New users automatically assigned free tier
- [ ] Free tier limits enforced (25 pages, 25 checkboxes/page, 2 lists)
- [ ] User can see current tier in UI
- [ ] Upgrade prompts shown when appropriate
- [ ] No payment required for free tier

**Technical Implementation:**
- User profile created with `subscription_tier = 'free'`
- Tier limits checked before operations
- Default limits applied automatically

---

### U5-S2: Enforce Free Tier Limits
**As a** free user
**I want to** see tier limits enforced
**So that** I understand usage constraints

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Max 25 pages per database extraction
- [ ] Max 25 checkboxes per page
- [ ] Max 2 todo lists total
- [ ] Clear error message when limit reached
- [ ] Upgrade prompt shown on limit
- [ ] Limits visible in settings/dashboard

**Tier Limits:**
```
Free:
- Max Pages: 25
- Max Checkboxes per Page: 25
- Max Todo Lists: 2
- Sync Frequency: Manual only
```

**Technical Implementation:**
- Limits checked in extraction logic
- Database constraints prevent exceeding limits
- Frontend validates before API calls

---

### U5-S3: Upgrade to Pro
**As a** user
**I want to** upgrade to Pro ($6.99/mo)
**So that** I can access more pages and checkboxes

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Upgrade to Pro"
- [ ] Redirected to Stripe Checkout
- [ ] Payment form accepts cards
- [ ] Success redirects back to app
- [ ] Tier immediately updates to Pro
- [ ] New limits apply instantly

**Pro Limits:**
```
Pro ($6.99/month):
- Max Pages: 100
- Max Checkboxes per Page: 100
- Max Todo Lists: 10
- Sync Frequency: Daily automatic
```

**Technical Implementation:**
- `/api/stripe/create-checkout-session` creates Stripe session
- User redirected to Stripe Checkout
- Webhook updates tier on successful payment
- User profile updated with Stripe IDs

---

### U5-S4: Upgrade to Max
**As a** user
**I want to** upgrade to Max ($19.99/mo)
**So that** I can have unlimited access

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Upgrade to Max"
- [ ] Redirected to Stripe Checkout
- [ ] Payment form accepts cards
- [ ] Success redirects back to app
- [ ] Tier immediately updates to Max
- [ ] Unlimited limits apply

**Max Limits:**
```
Max ($19.99/month):
- Max Pages: 500
- Max Checkboxes per Page: 1000
- Max Todo Lists: 25
- Sync Frequency: Hourly automatic
```

**Technical Implementation:**
- Same checkout flow as Pro
- Different Stripe Price ID for Max tier
- Higher limits enforced

---

### U5-S5: Stripe Checkout Flow
**As a** user
**I want to** be redirected to Stripe Checkout
**So that** I can securely pay for my subscription

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Secure redirect to Stripe hosted page
- [ ] Pre-filled with user email
- [ ] Support for credit/debit cards
- [ ] Success URL returns to app
- [ ] Cancel URL returns to pricing page
- [ ] Session expires after 24 hours

**Technical Implementation:**
- Stripe Checkout Session API
- Customer created if doesn't exist
- Subscription mode with recurring billing
- Success/cancel URLs configured

---

### U5-S6: Automatic Tier Update
**As a** user
**I want** my tier to update automatically after payment
**So that** I immediately get access to new limits

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Webhook receives payment success event
- [ ] User profile updated with new tier
- [ ] Stripe customer ID stored
- [ ] Subscription ID stored
- [ ] Subscription status tracked
- [ ] New limits immediately available

**Technical Implementation:**
- Stripe webhook endpoint `/api/stripe/webhook`
- Handles `checkout.session.completed` event
- Updates `user_profiles` table
- Stores subscription metadata

---

### U5-S7: Stripe Customer Portal
**As a** subscriber
**I want to** manage my subscription through Stripe Customer Portal
**So that** I can update payment methods or cancel

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] "Manage Subscription" button in settings
- [ ] Redirects to Stripe Customer Portal
- [ ] Can update payment method
- [ ] Can cancel subscription
- [ ] Can view billing history
- [ ] Can download invoices

**Technical Implementation:**
- `/api/stripe/create-portal-session` creates portal session
- Returns URL to Stripe-hosted portal
- Webhook handles cancellation events
- Tier downgrade on cancellation

---

### U5-S8: Display Current Tier
**As a** user
**I want to** see my current tier and limits in the UI
**So that** I know what I have access to

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Current tier badge visible
- [ ] Tier limits displayed (pages, checkboxes, lists)
- [ ] Usage counts shown (X of Y used)
- [ ] Next billing date shown (for paid tiers)
- [ ] Upgrade options visible

**Technical Implementation:**
- SubscriptionStore fetches tier from API
- UI components use tier data
- Progress bars show usage vs limits

---

### U5-S9: Upgrade Prompt on Limit
**As a** user hitting a tier limit
**I want to** see an upgrade prompt
**So that** I know how to get more access

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Modal shows when limit reached
- [ ] Explains which limit was hit
- [ ] Shows next tier benefits
- [ ] "Upgrade Now" button
- [ ] "Maybe Later" option
- [ ] Doesn't block critical functions

**Technical Implementation:**
- Limit checks return error with upgrade prompt
- Modal component shows tier comparison
- Direct link to upgrade flow

---

## Technical Architecture

### Components

#### 1. SubscriptionStore (Pinia)
**Attributes:**
- `subscription` (Subscription | null): Current subscription
- `limits` (TierLimits): Current tier limits
- `isLoading` (boolean): Loading state
- `error` (string | null): Error message

**Behaviors:**
- `fetchSubscription()`: Get current subscription
- `syncSubscription()`: Sync with Stripe
- `createCheckoutSession()`: Start upgrade flow
- `createPortalSession()`: Access billing portal
- `updateLimits()`: Recalculate tier limits

---

#### 2. StripeService
**Attributes:**
- `stripe` (Stripe): Stripe API client
- `supabase` (SupabaseClient): Database client

**Behaviors:**
- `createCustomer()`: Create Stripe customer
- `createCheckoutSession()`: Generate checkout URL
- `createPortalSession()`: Generate portal URL
- `handleWebhook()`: Process Stripe events
- `syncSubscription()`: Update from Stripe

**Business Rules:**
- One Stripe customer per user
- Subscription status tracked
- Webhooks update database
- Idempotency for all operations

---

#### 3. TierLimitEnforcer
**Attributes:**
- `tier` (SubscriptionTier): Current user tier
- `limits` (TierLimits): Tier-specific limits

**Behaviors:**
- `checkPageLimit()`: Validate page count
- `checkCheckboxLimit()`: Validate checkbox count
- `checkTodoListLimit()`: Validate list count
- `getAvailableQuota()`: Calculate remaining quota

**Business Rules:**
- Enforced before operations
- Clear error messages
- Upgrade prompts on limits

---

## Component Interactions

### Upgrade Flow
```
User clicks "Upgrade to Pro"
  ↓
POST /api/stripe/create-checkout-session { tier: 'pro' }
  ↓
Check if Stripe customer exists
  ↓
Create customer if needed
  ↓
Create Checkout Session with:
  - mode: 'subscription'
  - price: STRIPE_PRICE_ID_PRO
  - success_url: /dashboard?success=true
  - cancel_url: /pricing?canceled=true
  ↓
Return checkout URL
  ↓
Redirect user to Stripe Checkout
  ↓
User enters payment info
  ↓
Payment successful
  ↓
Redirect to success_url
  ↓
Stripe sends webhook: checkout.session.completed
  ↓
Webhook handler:
  - Extract customer_id, subscription_id
  - Update user_profiles:
    - subscription_tier = 'pro'
    - stripe_customer_id = customer_id
    - stripe_subscription_id = subscription_id
    - stripe_subscription_status = 'active'
    - stripe_current_period_end = period_end
  ↓
User sees dashboard with Pro tier
```

### Webhook Event Handling
```
Stripe sends webhook event
  ↓
POST /api/stripe/webhook
  ↓
Verify webhook signature
  ↓
Parse event type:

  checkout.session.completed:
    - Create/update user profile
    - Set tier based on price_id
    - Store subscription metadata

  customer.subscription.updated:
    - Update subscription status
    - Update period end date

  customer.subscription.deleted:
    - Set tier to 'free'
    - Mark subscription as canceled

  invoice.payment_failed:
    - Set status to 'past_due'
    - Send notification email
  ↓
Return 200 OK to Stripe
```

### Tier Limit Enforcement
```
User attempts to create todo list
  ↓
Check current todo list count
  ↓
Get tier limits from SubscriptionStore
  ↓
If count >= limit:
  - Show upgrade modal
  - Explain limit reached
  - Offer upgrade to higher tier
  - Block operation
  ↓
If count < limit:
  - Allow operation
  - Continue with creation
```

---

## Database Schema

### user_profiles (Subscription Fields)
```sql
ALTER TABLE user_profiles
ADD COLUMN subscription_tier TEXT DEFAULT 'free',
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN stripe_subscription_status TEXT,
ADD COLUMN stripe_current_period_end TIMESTAMP WITH TIME ZONE;
```

---

## API Endpoints

### POST /api/stripe/create-checkout-session
**Request:**
```json
{
  "tier": "pro"
}
```

**Response:**
```json
{
  "data": {
    "url": "https://checkout.stripe.com/pay/cs_..."
  }
}
```

---

### POST /api/stripe/create-portal-session
**Response:**
```json
{
  "data": {
    "url": "https://billing.stripe.com/session/..."
  }
}
```

---

### POST /api/stripe/webhook
**Headers:**
- `stripe-signature`: Webhook signature for verification

**Body:** Stripe event object

**Response:**
```json
{
  "received": true
}
```

---

### GET /api/subscription
**Response:**
```json
{
  "data": {
    "tier": "pro",
    "status": "active",
    "current_period_end": "2024-02-15T12:00:00Z",
    "limits": {
      "maxPages": 100,
      "maxCheckboxesPerPage": 100,
      "maxTodoLists": 10
    }
  }
}
```

---

## Stripe Configuration

### Products & Prices
```
Product: Checkify Pro
Price ID: price_pro_monthly
Amount: $6.99 USD
Interval: month

Product: Checkify Max
Price ID: price_max_monthly
Amount: $19.99 USD
Interval: month
```

### Webhook Events
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Testing Scenarios

### Test Case 1: Free Tier Limits
1. Create account (free tier)
2. Create first todo list (success)
3. Create second todo list (success)
4. Attempt third todo list (blocked with upgrade prompt)
5. Verify error message explains limit

### Test Case 2: Upgrade to Pro
1. Click "Upgrade to Pro"
2. Redirected to Stripe Checkout
3. Enter test card: 4242 4242 4242 4242
4. Complete payment
5. Redirected to dashboard
6. Verify tier badge shows "Pro"
7. Verify can create more todo lists

### Test Case 3: Cancel Subscription
1. Have active Pro subscription
2. Click "Manage Subscription"
3. Navigate to cancel in portal
4. Cancel subscription
5. Verify tier remains Pro until period end
6. After period end, verify downgrade to free

### Test Case 4: Failed Payment
1. Have active subscription
2. Simulate failed payment (Stripe test mode)
3. Verify status changes to "past_due"
4. Verify user notified
5. Verify access maintained temporarily

---

## Related Documentation
- [Subscription Tiers](.claude/features/subscription-tiers.md)
- [Stripe Integration](.claude/features/stripe-integration.md)
- [Database Schema](.claude/technical/database-schema.md)
