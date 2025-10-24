# Domain Model: U9 - Email Communication (Brevo MCP)

## Overview
AI-powered email communication through Brevo's Model Context Protocol (MCP) integration, enabling natural language management of transactional and marketing emails.

**Integration Type:** MCP (Model Context Protocol)

---

## Purpose

Brevo MCP provides seamless access to email marketing and transactional email capabilities directly through Claude Code, allowing developers to:
- Manage contacts and customer data conversationally
- Create and deploy email campaigns through natural language
- Monitor email performance and analytics
- Build and test email templates for transactional emails

This integration bridges Checkify.so's subscription and user management with professional email communication.

---

## MCP Configuration

### Project-Specific Setup

**Location:** `.mcp.json` (root directory)

**Note:** This file is git-ignored to protect API credentials. Use `.mcp.json.example` as template.

```json
{
  "mcpServers": {
    "brevo_contacts": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.brevo.com/v1/brevo_contacts/mcp/YOUR_BREVO_MCP_API_KEY"
      ]
    },
    "brevo_email_campaigns": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.brevo.com/v1/brevo_email_campaign_management/mcp/YOUR_BREVO_MCP_API_KEY"
      ]
    },
    "brevo_templates": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.brevo.com/v1/brevo_templates/mcp/YOUR_BREVO_MCP_API_KEY"
      ]
    },
    "brevo_campaign_analytics": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.brevo.com/v1/brevo_campaign_analytics/mcp/YOUR_BREVO_MCP_API_KEY"
      ]
    }
  }
}
```

### Getting Your MCP API Key

1. Go to Brevo Dashboard → **SMTP & API** → **API Keys & MCP**
2. Click **Generate a new API key**
3. Name it (e.g., "Checkify Claude Code MCP")
4. Enable **Create MCP server API key** option
5. Copy the key and add to `.mcp.json`

**Security:** MCP API keys are only shown once. Store securely and never commit to git.

---

## Available Services

### 1. Contact Management (`brevo_contacts`)

**Purpose:** Manage customer contacts and lists

**Use Cases for Checkify:**
- Add new users to email lists upon signup
- Segment users by subscription tier (Free, Pro, Max)
- Update contact attributes (subscription status, todo count, etc.)
- Create contact lists for targeted campaigns

**Example Prompts:**
```
"Show me all contacts in the Pro tier segment"
"Add new user john@example.com to the welcome campaign list"
"Update contact attributes for users who upgraded this month"
```

---

### 2. Email Campaign Management (`brevo_email_campaigns`)

**Purpose:** Create, send, and manage marketing email campaigns

**Use Cases for Checkify:**
- Feature announcement emails to all users
- Re-engagement campaigns for inactive users
- Upgrade promotion emails to free tier users
- Product updates and changelog notifications

**Example Prompts:**
```
"Create a campaign announcing the new sync-to-database feature"
"Send a test of the holiday promotion campaign to the team"
"Schedule the upgrade reminder campaign for free users"
```

---

### 3. Template Management (`brevo_templates`)

**Purpose:** Design and manage email templates for transactional emails

**Use Cases for Checkify:**
- Welcome email template for new signups
- Subscription confirmation emails (via Stripe webhooks)
- Payment failure notifications
- Todo sync completion emails
- Password reset emails

**Example Prompts:**
```
"Create a welcome email template with Checkify branding"
"Show me the subscription confirmation template"
"Update the payment failed template to include support link"
```

---

### 4. Campaign Analytics (`brevo_campaign_analytics`)

**Purpose:** Track email performance metrics

**Use Cases for Checkify:**
- Monitor open rates for feature announcements
- Track conversion rates for upgrade campaigns
- Analyze engagement by user segment
- Compare campaign performance over time

**Example Prompts:**
```
"Show me the open rate for last week's feature announcement"
"Compare upgrade campaign performance between free and pro tiers"
"Get analytics for all campaigns sent this month"
```

---

## Integration Points with Existing Features

### 1. User Authentication (U1)

**Connection:** New user signups trigger welcome email flow

**Implementation:**
```typescript
// server/api/auth/signup-complete.ts
export default defineEventHandler(async (event) => {
  const { user } = event.context

  // After Supabase user creation
  // Ask Claude Code:
  // "Add contact {user.email} to welcome campaign list"
})
```

---

### 2. Subscription & Billing (U5)

**Connection:** Subscription events trigger transactional emails

**Stripe Webhook Integration:**
```typescript
// server/api/stripe/webhook.post.ts

// On checkout.session.completed:
// "Send subscription confirmation email to {customer.email} using Pro tier template"

// On customer.subscription.deleted:
// "Send subscription cancellation confirmation to {customer.email}"

// On invoice.payment_failed:
// "Send payment failure notification to {customer.email} with retry instructions"
```

---

### 3. Notion Integration (U2)

**Connection:** Sync completion notifications

**Use Case:**
```
// After successful sync-to-database operation:
// "Send sync completion email to {user.email} with stats: {pageCount} pages synced"
```

---

### 4. Analytics Tracking (U7)

**Connection:** Cross-reference email engagement with app usage

**Use Case:**
```
// Combine PostHog data with Brevo analytics:
// "Show me users who opened the upgrade email but didn't convert"
// "Compare feature adoption rates for users who received the tutorial email"
```

---

## Email Campaign Strategy

### Transactional Emails

**Triggers & Templates:**

| Event | Template | Brevo Service |
|-------|----------|---------------|
| User signs up | Welcome email | `brevo_templates` |
| Subscription upgraded | Upgrade confirmation | `brevo_templates` |
| Payment successful | Payment receipt | `brevo_templates` |
| Payment failed | Payment retry reminder | `brevo_templates` |
| Subscription canceled | Cancellation confirmation | `brevo_templates` |
| Sync completed | Sync summary | `brevo_templates` |

### Marketing Campaigns

**Campaign Types:**

1. **Onboarding Series**
   - Day 1: Welcome + quick start guide
   - Day 3: Feature highlights (sync, multi-database)
   - Day 7: Tips & best practices
   - Day 14: Upgrade prompt (if still on free tier)

2. **Engagement Campaigns**
   - Monthly feature updates
   - User success stories
   - Productivity tips using Checkify

3. **Conversion Campaigns**
   - Free → Pro: Emphasize page/checkbox limits
   - Pro → Max: Highlight automatic sync + limits
   - Churn prevention: Re-engage inactive users

4. **Announcement Campaigns**
   - New feature launches
   - Product roadmap updates
   - Integration announcements

---

## User Segmentation

**Brevo Contact Attributes (sync from Supabase):**

```typescript
{
  EMAIL: user.email,
  FIRSTNAME: user.first_name,
  SUBSCRIPTION_TIER: user.subscription_tier,        // free | pro | max
  SUBSCRIPTION_STATUS: user.subscription_status,    // active | canceled | past_due
  SIGNUP_DATE: user.created_at,
  PAGE_COUNT: user.connected_pages?.length || 0,
  TODO_LIST_COUNT: user.todo_lists?.length || 0,
  LAST_SYNC: user.last_sync_at
}
```

**Segments:**

- **Free Users (< 7 days)** - Onboarding sequence
- **Free Users (> 14 days)** - Upgrade campaigns
- **Pro Users** - Feature deep-dives, Max upsell
- **Max Users** - Premium tips, beta features
- **Inactive Users (> 30 days)** - Re-engagement
- **High-Value Users (Max + high usage)** - Referral programs

---

## Common Claude Code Workflows

### Workflow 1: Send Welcome Email to New User

```
1. User signs up via Google OAuth
2. Supabase creates user record
3. In Claude Code session:
   "Add contact emma@example.com to the new-users list with attributes:
    - FIRSTNAME: Emma
    - SUBSCRIPTION_TIER: free
    - SIGNUP_DATE: 2025-10-23"
4. "Send welcome email template to emma@example.com"
```

### Workflow 2: Create Upgrade Campaign

```
1. "Show me all contacts in the free tier who signed up > 14 days ago"
2. "Create a new campaign called 'October Upgrade Promotion' targeting free tier users"
3. "Use the upgrade-promo template with 20% discount code"
4. "Schedule campaign for tomorrow at 10am PST"
5. "Send test to team@checkify.so first"
```

### Workflow 3: Monitor Campaign Performance

```
1. "Show me analytics for the last feature announcement campaign"
2. "What was the open rate compared to our average?"
3. "Show me which users clicked the 'Try New Feature' button"
4. "Create a follow-up campaign for users who didn't open"
```

### Workflow 4: Build Transactional Template

```
1. "Create a new email template called 'payment-failed-reminder'"
2. "Subject: Action Required: Update Your Payment Method"
3. "Include:
    - Friendly reminder about failed payment
    - Link to Stripe Customer Portal: {{PORTAL_URL}}
    - 48-hour grace period notice
    - Support contact: support@checkify.so"
4. "Show me preview"
5. "Save template"
```

---

## Environment Variables

**Not Required:** Brevo MCP uses API key in `.mcp.json` directly.

**Alternative Approach (if implementing server-side Brevo SDK):**
```env
BREVO_API_KEY=xkeysib-...
```

---

## File Structure

```
/Users/myang/git/checkify.so-nuxt/
├── .mcp.json                          # MCP config (git-ignored)
├── .mcp.json.example                  # Template for team
└── aidlc-docs/
    └── construction/
        └── model_U9_email_communication.md  # This file
```

---

## Activation & Usage

### Step 1: Configure MCP

1. Copy `.mcp.json.example` → `.mcp.json`
2. Replace `YOUR_BREVO_MCP_API_KEY` with actual key from Brevo
3. Save file

### Step 2: Restart Claude Code

```bash
# Exit current session
exit

# Restart Claude Code in project directory
cd /Users/myang/git/checkify.so-nuxt
claude
```

### Step 3: Verify Connection

In Claude Code, run:
```bash
claude mcp list
```

Should show:
- ✓ brevo_contacts
- ✓ brevo_email_campaigns
- ✓ brevo_templates
- ✓ brevo_campaign_analytics

### Step 4: Start Using

Ask Claude Code natural language questions:
```
"Show me all my Brevo email templates"
"How many contacts do I have in total?"
"What was the open rate for last week's campaign?"
```

---

## Business Rules

1. **Privacy First:** Only sync necessary user data to Brevo
2. **Opt-Out Support:** Respect unsubscribe requests immediately
3. **Transactional vs Marketing:** Separate lists and templates
4. **GDPR Compliance:** Include unsubscribe link in all marketing emails
5. **Rate Limiting:** Respect Brevo API limits (varies by plan)
6. **Testing:** Always send test emails before production campaigns

---

## Advantages of MCP Approach

**vs Traditional Brevo SDK Integration:**

| Aspect | MCP | SDK |
|--------|-----|-----|
| Setup Time | Minutes | Hours |
| Code Required | None | Extensive |
| Maintenance | Zero | Ongoing |
| Flexibility | Natural language | Programmatic |
| Learning Curve | Instant | Documentation required |
| Error Handling | Conversational | Manual |

**Best Use Case:** MCP excels for campaign management, testing, and analytics. For automated transactional emails triggered by webhooks, consider complementing with Brevo SDK.

---

## Future Enhancements

1. **Automated Workflows:**
   - Trigger emails directly from Supabase webhooks
   - Sync contact attributes on subscription changes
   - Auto-segment users based on usage patterns

2. **Advanced Campaigns:**
   - A/B testing for subject lines
   - Personalized send times
   - Dynamic content based on tier

3. **Integration Expansion:**
   - SMS campaigns for critical notifications
   - WhatsApp messages for high-value users
   - Push notifications via Brevo

4. **Analytics Dashboard:**
   - Nuxt page displaying Brevo stats
   - Combine with PostHog for unified view
   - Revenue attribution from campaigns

---

## Related Documentation

- Subscription & Billing: `model_U5_subscription_billing.md`
- User Authentication: `model_U1_user_authentication.md`
- Analytics Tracking: `model_U7_analytics_tracking.md`
- Brevo MCP Official Docs: https://help.brevo.com/hc/en-us/articles/27978590646802
