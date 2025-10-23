# Unit 7: Analytics & Tracking

## Epic Overview
Integrate PostHog and Umami for feature usage analytics and privacy-friendly web analytics.

**Status:** 🟢 Completed
**Priority:** Medium
**Dependencies:** U1 (User Authentication)

---

## User Stories

### U7-S1: Track Feature Usage with PostHog
**As a** product owner
**I want to** track feature usage with PostHog
**So that** I can understand user behavior

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] PostHog SDK integrated into app
- [ ] Key events tracked (signup, Notion connect, list creation, etc.)
- [ ] User properties captured (tier, signup date)
- [ ] Events sent asynchronously (non-blocking)
- [ ] Feature flags available via PostHog
- [ ] Can be disabled via environment variable

**Tracked Events:**
```
- user_signed_up
- notion_connected
- todo_list_created
- checkbox_toggled
- sync_to_notion_triggered
- subscription_upgraded
- subscription_canceled
```

**Technical Implementation:**
- PostHog client initialized on app load
- Event tracking via `posthog.capture()`
- User identification on login
- Environment variable toggle

---

### U7-S2: Track Page Views with Umami
**As a** product owner
**I want to** track page views with Umami
**So that** I can see traffic patterns

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Umami script loaded on all pages
- [ ] Page views tracked automatically
- [ ] No cookies used (GDPR compliant)
- [ ] No personal data collected
- [ ] Can view analytics dashboard
- [ ] Can be disabled via environment variable

**Tracked Metrics:**
```
- Page views
- Unique visitors
- Referrers
- Countries
- Devices/browsers
- Page performance
```

**Technical Implementation:**
- Umami script injected via Nuxt plugin
- Analytics dashboard at umami.checkify.so
- Privacy-first approach (no cookies)

---

### U7-S3: GDPR-Compliant Analytics
**As a** user
**I want** my privacy respected with GDPR-compliant analytics
**So that** my data isn't misused

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] No personally identifiable information (PII) tracked
- [ ] Cookie-free tracking (Umami)
- [ ] Data anonymized
- [ ] Users can opt-out if desired
- [ ] Privacy policy explains analytics usage
- [ ] Complies with GDPR requirements

**Privacy Measures:**
```
- No email addresses in analytics
- No IP address tracking
- Hashed user IDs only
- Aggregate data only
- Data retention policies
```

**Technical Implementation:**
- PostHog configured for privacy
- Umami is inherently privacy-first
- User IDs hashed before sending
- No sensitive data in events

---

### U7-S4: Environment Variable Configuration
**As a** developer
**I want** analytics configured via environment variables
**So that** I can enable/disable tracking easily

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] PostHog enabled via POSTHOG_KEY env var
- [ ] Umami enabled via UMAMI_WEBSITE_ID env var
- [ ] Missing env vars disable tracking gracefully
- [ ] Dev environment has tracking disabled by default
- [ ] Production environment has tracking enabled
- [ ] Easy to toggle for testing

**Environment Variables:**
```
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://app.posthog.com

UMAMI_WEBSITE_ID=uuid-...
UMAMI_SRC=https://analytics.umami.is/script.js
```

**Technical Implementation:**
- Runtime config checks for env vars
- Graceful degradation if not configured
- Console warnings in dev if missing

---

### U7-S5: Track Key User Journeys
**As a** product owner
**I want to** track key user journeys
**So that** I can identify drop-off points

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Signup funnel tracked (start → complete)
- [ ] Onboarding flow tracked (steps completed)
- [ ] Notion connection funnel (start → success)
- [ ] Todo list creation tracked
- [ ] Feature adoption metrics visible
- [ ] Conversion rates calculable

**Key Funnels:**
```
1. Signup Funnel:
   - Visit landing page
   - Click "Get Started"
   - Complete Google OAuth
   - Reach dashboard

2. Onboarding Funnel:
   - Connect Notion
   - Select database
   - Create first todo list
   - Toggle first checkbox

3. Upgrade Funnel:
   - Hit tier limit
   - View pricing
   - Click upgrade
   - Complete payment
```

**Technical Implementation:**
- Funnel events tracked in PostHog
- Conversion rates calculated
- Drop-off points identified
- A/B testing capabilities

---

## Technical Architecture

### Components

#### 1. PostHogService
**Attributes:**
- `client` (PostHog): PostHog SDK instance
- `isEnabled` (boolean): Whether tracking is active
- `userId` (string | null): Current user identifier

**Behaviors:**
- `initialize()`: Setup PostHog client
- `identify()`: Associate user with session
- `capture()`: Track custom event
- `setUserProperties()`: Update user metadata
- `reset()`: Clear user identification on logout

**Business Rules:**
- Only track if API key configured
- Hash user IDs for privacy
- No PII in events
- Async to avoid blocking UI

---

#### 2. UmamiService
**Attributes:**
- `websiteId` (string): Umami website identifier
- `scriptSrc` (string): Umami script URL
- `isEnabled` (boolean): Whether tracking is active

**Behaviors:**
- `loadScript()`: Inject Umami tracking script
- `trackPageView()`: Manual page view tracking
- `trackEvent()`: Custom event tracking

**Business Rules:**
- Cookie-free by design
- No user identification
- Automatic page view tracking
- Privacy-first approach

---

#### 3. AnalyticsPlugin (Nuxt)
**Attributes:**
- `posthog` (PostHogService): PostHog instance
- `umami` (UmamiService): Umami instance

**Behaviors:**
- `setup()`: Initialize analytics services
- `trackPageView()`: Track navigation
- `trackEvent()`: Unified event tracking
- `setUser()`: Identify current user

**Provides:**
- `$analytics` injected into Nuxt context
- Available in components via `useNuxtApp()`

---

## Component Interactions

### Analytics Initialization
```
App loads
  ↓
Analytics plugin initializes
  ↓
Check environment variables:
  - POSTHOG_API_KEY present?
  - UMAMI_WEBSITE_ID present?
  ↓
If PostHog configured:
  - Initialize PostHog client
  - Set up auto-capture (optional)
  - Register feature flags
  ↓
If Umami configured:
  - Inject Umami script
  - Begin automatic page tracking
  ↓
User logs in
  ↓
PostHog.identify(user.id, {
  tier: user.subscription_tier,
  signup_date: user.created_at
})
  ↓
Ready to track events
```

### Event Tracking Flow
```
User performs action (e.g., creates todo list)
  ↓
Component calls: $analytics.track('todo_list_created', { ... })
  ↓
PostHog.capture('todo_list_created', {
  database_id: notionDatabaseId,
  tier: userTier,
  timestamp: Date.now()
})
  ↓
Event sent asynchronously to PostHog
  ↓
Available in PostHog dashboard for analysis
```

### User Journey Tracking
```
Landing Page → 'page_viewed'
  ↓
Click "Get Started" → 'signup_started'
  ↓
Complete OAuth → 'signup_completed', identify(user_id)
  ↓
Dashboard loaded → 'onboarding_started'
  ↓
Click "Connect Notion" → 'notion_connection_started'
  ↓
OAuth success → 'notion_connected'
  ↓
Select database → 'database_selected'
  ↓
Todo list created → 'todo_list_created'
  ↓
First checkbox toggled → 'first_checkbox_toggled'
  ↓
Onboarding complete → 'onboarding_completed'
```

---

## PostHog Configuration

### Initialization
```typescript
// plugins/posthog.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const posthogKey = config.public.posthogKey;

  if (!posthogKey) {
    console.warn('PostHog API key not configured');
    return;
  }

  const posthog = new PostHog(posthogKey, {
    api_host: 'https://app.posthog.com',
    loaded: (posthog) => {
      if (import.meta.env.DEV) {
        posthog.opt_out_capturing();
      }
    }
  });

  nuxtApp.provide('posthog', posthog);
});
```

### Event Capture
```typescript
// Example usage in component
const { $posthog } = useNuxtApp();

function trackTodoListCreation() {
  $posthog.capture('todo_list_created', {
    database_id: databaseId,
    tier: subscriptionTier,
    checkbox_count: checkboxes.length
  });
}
```

---

## Umami Configuration

### Script Injection
```typescript
// nuxt.config.ts
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
});
```

### Custom Event Tracking
```typescript
// Track custom events
declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: object) => void;
    };
  }
}

// Usage
window.umami?.track('subscription_upgraded', {
  tier: 'pro'
});
```

---

## Privacy Compliance

### Data Minimization
- Only track essential events
- No email addresses or names
- Hash user IDs before sending
- Aggregate data when possible

### User Consent
- Analytics explained in privacy policy
- Opt-out available for users
- Cookie-free tracking (Umami)
- GDPR-compliant practices

### Data Retention
- PostHog: 90 days (configurable)
- Umami: 365 days (configurable)
- Automatic data deletion

---

## Testing Scenarios

### Test Case 1: PostHog Initialization
1. Configure POSTHOG_API_KEY
2. Load app
3. Verify PostHog client initialized
4. Check browser console for PostHog messages
5. Verify events appear in PostHog dashboard

### Test Case 2: Event Tracking
1. Perform trackable action (create todo list)
2. Verify event fired in browser console
3. Check PostHog dashboard
4. Verify event details correct

### Test Case 3: User Identification
1. Sign up for new account
2. Verify `signup_completed` event
3. Verify user identified in PostHog
4. Verify user properties set (tier, etc.)

### Test Case 4: Umami Page Views
1. Navigate between pages
2. Check Umami dashboard
3. Verify page views tracked
4. Verify no cookies set

### Test Case 5: Privacy Compliance
1. Inspect tracked events
2. Verify no PII present
3. Verify user IDs hashed
4. Verify GDPR compliance

---

## Analytics Dashboards

### PostHog Dashboards
```
1. User Acquisition:
   - Signups over time
   - Conversion funnel
   - Referral sources

2. Feature Adoption:
   - Notion connections
   - Todo lists created
   - Checkboxes toggled
   - Sync usage

3. Engagement:
   - Daily/Weekly active users
   - Session duration
   - Feature usage frequency

4. Revenue:
   - Subscription upgrades
   - Tier distribution
   - Churn rate
```

### Umami Dashboards
```
1. Traffic Overview:
   - Page views
   - Unique visitors
   - Bounce rate

2. Pages:
   - Most viewed pages
   - Entry pages
   - Exit pages

3. Geography:
   - Countries
   - Regions

4. Technology:
   - Browsers
   - Operating systems
   - Devices
```

---

## Related Documentation
- [Architecture Overview](.claude/technical/architecture.md)
- [Privacy Policy](https://checkify.so/privacy)
