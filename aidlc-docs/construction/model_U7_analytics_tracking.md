# Domain Model: U7 - Analytics & Tracking

## Overview
PostHog and Umami integration for feature analytics and privacy-friendly web analytics.

**Related User Stories:** See `planning/units/U7_analytics_tracking.md`

---

## Analytics Stack

1. **PostHog** - Feature usage and user behavior
2. **Umami** - Privacy-friendly web analytics

---

## Domain Components

### 1. PostHog Integration

**Purpose:** Track feature usage, user journeys, and conversion funnels

**Configuration:** Environment variables

```
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://app.posthog.com
```

**Initialization:** Client-side plugin

**Location:** `plugins/posthog.client.ts` (expected location based on architecture)

**Implementation:**
```typescript
import posthog from 'posthog-js'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const posthogKey = config.public.posthogKey

  if (!posthogKey) {
    console.warn('PostHog not configured')
    return
  }

  posthog.init(posthogKey, {
    api_host: 'https://app.posthog.com',
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.opt_out_capturing() // Disable in development
      }
    }
  })

  // Make available globally
  nuxtApp.provide('posthog', posthog)
})
```

**Tracked Events:**
```typescript
// User lifecycle
'user_signed_up'
'user_logged_in'
'user_logged_out'

// Notion connection
'notion_connection_started'
'notion_connected'
'notion_disconnected'

// Todo management
'todo_list_created'
'todo_list_viewed'
'todo_list_deleted'
'checkbox_toggled'

// Sync features
'sync_to_notion_triggered'
'sync_completed'

// Subscription
'subscription_upgrade_clicked'
'subscription_upgraded'
'subscription_canceled'
'billing_portal_opened'
```

**User Properties:**
```typescript
posthog.identify(userId, {
  subscription_tier: 'pro',
  signup_date: '2024-01-15',
  notion_connected: true,
  todo_lists_count: 5
})
```

---

### 2. Umami Integration

**Purpose:** Privacy-friendly page view tracking (GDPR compliant)

**Configuration:**
```
UMAMI_WEBSITE_ID=uuid-...
UMAMI_SRC=https://analytics.umami.is/script.js
```

**Implementation:** Script injection in `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  app: {
    head: {
      script: process.env.UMAMI_WEBSITE_ID ? [
        {
          src: process.env.UMAMI_SRC || 'https://analytics.umami.is/script.js',
          'data-website-id': process.env.UMAMI_WEBSITE_ID,
          async: true,
          defer: true
        }
      ] : []
    }
  }
})
```

**Tracked Metrics:**
- Page views (automatic)
- Unique visitors
- Referrers
- Countries/regions
- Devices/browsers
- No cookies
- No personal data

**Custom Events:**
```typescript
// Global umami object available on window
declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: object) => void
    }
  }
}

// Usage
window.umami?.track('subscription_upgraded', { tier: 'pro' })
```

---

## Event Tracking Patterns

### Component-Level Tracking

```vue
<script setup>
const { $posthog } = useNuxtApp()

function handleTodoListCreation() {
  // Business logic
  createTodoList(...)

  // Track event
  $posthog.capture('todo_list_created', {
    database_id: databaseId,
    tier: userTier,
    checkbox_count: checkboxes.length
  })
}
</script>
```

### Composable for Analytics

**Location:** `composables/useAnalytics.ts` (expected)

```typescript
export const useAnalytics = () => {
  const { $posthog } = useNuxtApp()

  const trackEvent = (eventName: string, properties?: object) => {
    $posthog?.capture(eventName, properties)
    window.umami?.track(eventName, properties)
  }

  const identifyUser = (userId: string, traits?: object) => {
    $posthog?.identify(userId, traits)
  }

  return {
    trackEvent,
    identifyUser
  }
}
```

**Usage:**
```typescript
const analytics = useAnalytics()
analytics.trackEvent('subscription_upgraded', { tier: 'pro' })
```

---

## User Journeys Tracked

### 1. Signup Funnel
```
page_viewed: /
  ↓
clicked: Get Started
  ↓
user_signed_up
  ↓
identify(user_id, { signup_date, tier: 'free' })
  ↓
page_viewed: /dashboard
```

### 2. Onboarding Funnel
```
notion_connection_started
  ↓
notion_connected
  ↓
database_selected
  ↓
todo_list_created
  ↓
first_checkbox_toggled
  ↓
onboarding_completed
```

### 3. Upgrade Funnel
```
tier_limit_reached
  ↓
upgrade_prompt_shown
  ↓
subscription_upgrade_clicked
  ↓
checkout_started
  ↓
subscription_upgraded
  ↓
identify(user_id, { tier: 'pro' })
```

---

## Privacy Compliance

### GDPR Compliance

**PostHog:**
- Hash user IDs before sending
- No email addresses in events
- User can opt-out
- Data retention configurable

**Umami:**
- No cookies
- No personal data
- No IP tracking
- GDPR compliant by design

**Implementation:**
```typescript
// Hash user ID for privacy
import { createHash } from 'crypto'

function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex')
}

// Use hashed ID in PostHog
posthog.identify(hashUserId(user.id), properties)
```

---

## Analytics Dashboards

### PostHog Dashboards

1. **User Acquisition**
   - Signups over time
   - Conversion rates
   - Referral sources

2. **Feature Adoption**
   - Notion connections
   - Todo lists created
   - Sync usage
   - Checkbox toggles

3. **Engagement**
   - DAU/WAU/MAU
   - Session duration
   - Feature usage frequency

4. **Revenue**
   - Subscription upgrades
   - Tier distribution
   - Churn rate

### Umami Dashboards

1. **Traffic Overview**
   - Page views
   - Unique visitors
   - Bounce rate

2. **Pages**
   - Most viewed pages
   - Entry/exit pages

3. **Geography**
   - Countries
   - Regions

4. **Technology**
   - Browsers
   - Operating systems
   - Devices

---

## Implementation Checklist

- [x] PostHog configured via environment variables
- [x] Umami script injection in nuxt.config
- [ ] Analytics composable created
- [ ] Event tracking added to key actions
- [ ] User identification on login
- [ ] Privacy policy updated
- [ ] GDPR opt-out mechanism
- [ ] Analytics documented for team

---

## Business Rules

1. **Opt-Out in Development:** No tracking in dev mode
2. **User Privacy:** Hash all user identifiers
3. **No PII:** Never send email addresses or names
4. **Graceful Degradation:** App works if analytics disabled
5. **Environment-Based:** Only enabled in production

---

## Testing

**Verify PostHog:**
1. Open PostHog dashboard
2. Perform action in app
3. Check Events tab in PostHog
4. Verify event properties

**Verify Umami:**
1. Open Umami dashboard
2. Navigate between pages
3. Check real-time view
4. Verify page views incrementing

---

## Related Documentation
- User Stories: `planning/units/U7_analytics_tracking.md`
- Architecture: `.claude/technical/architecture.md`
