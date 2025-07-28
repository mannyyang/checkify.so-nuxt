# Quickstart Guide

*Last updated: January 2025*

Get up and running with Checkify.so in 5 minutes.

## Prerequisites

- Node.js 22+ and pnpm
- Supabase account
- Notion account and integration

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/checkify.so-nuxt.git
cd checkify.so-nuxt
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually run migrations in order:
# - 20240101000000_initial_schema.sql
# - 20250122_add_todo_list_metadata.sql
# - Additional migrations as needed
```

### 4. Configure Environment Variables

Create a `.env` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# App
BASE_URL=http://localhost:3000

# Notion OAuth (required for Notion integration)
NOTION_OAUTH_CLIENT_ID=your-notion-oauth-client-id
NOTION_OAUTH_CLIENT_SECRET=your-notion-oauth-client-secret

# Stripe (required for subscription features)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID_PRO=price_xxxxx
STRIPE_PRICE_ID_MAX=price_xxxxx
```

### 5. Set Up Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new OAuth integration:
   - Type: Public
   - Redirect URI: `http://localhost:3000/api/connect-notion`
   - Capabilities: Read content, Update content, Read user info

### 6. Set Up Stripe (Required for Subscriptions)

1. **Create a Stripe Account**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Use test mode for development (toggle in dashboard)

2. **Create Products and Prices**
   - Navigate to Products → Create Product
   - Create "Checkify Pro" product:
     - Price: $6.99/month (recurring)
     - Copy the price ID (starts with `price_`)
   - Create "Checkify Max" product:
     - Price: $19.99/month (recurring)
     - Copy the price ID

3. **Set Up Webhook Endpoint**
   - Go to Developers → Webhooks → Add endpoint
   - Endpoint URL: `http://localhost:3000/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the signing secret (starts with `whsec_`)

4. **Update Environment Variables**
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxx        # From API keys page
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx   # From API keys page
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx      # From webhook endpoint
   STRIPE_PRICE_ID_PRO=price_xxxxx        # Pro tier price ID
   STRIPE_PRICE_ID_MAX=price_xxxxx        # Max tier price ID
   ```

5. **Test Webhook Locally**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

For detailed Stripe setup, see [Stripe Integration Guide](../features/stripe-integration.md).

### 7. Configure Analytics (Optional)

**PostHog**: Update `plugins/posthog.client.ts` with your project key
```typescript
posthogLib.init('your-project-key', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only'
});
```

**Umami**: Configure in `nuxt.config.ts` if using self-hosted analytics

### 8. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## First Run Experience

### 1. Sign In
- Click "Sign in with Google"
- Authenticate via Supabase

### 2. Connect Notion
- Click "Connect Notion"
- Authorize the integration
- Grant access to your workspace

### 3. Select Databases
- Choose which Notion databases to track
- Click "Create Todo List"

### 4. View Your Todos
- All checkboxes from selected databases appear
- See extraction metadata (pages processed, checkboxes found)
- Click checkboxes to toggle state
- Changes sync instantly to Notion
- Use "Sync to Notion" to create aggregated database

## Using Sync Features

### Sync to Notion Database
This feature is now available to all users without feature flags.

### Create Sync Database
1. Open a todo list
2. Click "Sync to Notion" button
3. The system will create a new Notion database
4. All todos are aggregated with links to sources
5. View the created database in Notion

## Common Issues

### "No todos found"
- Ensure your Notion pages have checkbox blocks
- Check that the integration has access to pages
- Verify pages aren't archived

### "Failed to connect Notion"
- Check redirect URI matches exactly
- Ensure client ID/secret are correct
- Verify integration is published

### "Sync failed"
- Confirm you have edit permissions
- Check parent page ID is valid
- Ensure not hitting rate limits

## Next Steps

- Read the [Architecture Overview](../technical/architecture.md)
- Explore [API Reference](../technical/api-reference.md)
- Learn about [Feature Development](./development.md)
- Configure [Webhooks](../features/webhook-integration.md)

## Getting Help

- Check existing [documentation](..)
- Review [common issues](./development.md#troubleshooting)
- Open an issue on GitHub
- Contact support

## Quick Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview build

# Testing
pnpm test:unit        # Run unit tests
pnpm test:ui          # Test with UI
pnpm test:coverage    # Coverage report

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript checks

# Database
supabase db push      # Apply migrations
supabase db reset     # Reset database

# Stripe Testing
stripe listen --forward-to localhost:3000/api/stripe/webhook
```