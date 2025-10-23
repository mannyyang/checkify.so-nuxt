# Domain Model: U8 - Infrastructure & DevOps

## Overview
Deployment, monitoring, caching, error handling, and performance optimization infrastructure.

**Related User Stories:** See `planning/units/U8_infrastructure_devops.md`

---

## Deployment Architecture

### Platform: Railway / Netlify / Vercel

**Build Configuration:**
```
Command: pnpm build
Output: .output/public
Node: 18+
```

**Deployment Flow:**
```
Git Push to main
  ↓
CI/CD Pipeline Triggers
  ↓
1. Install dependencies (pnpm install)
  ↓
2. Type checking (npx nuxi typecheck)
  ↓
3. Linting (pnpm lint)
  ↓
4. Tests (pnpm test)
  ↓
5. Build (pnpm build)
  ↓
6. Deploy to Platform
  ↓
7. Health Check
  ↓
Success → Live
Failure → Rollback
```

---

## Environment Configuration

### Required Variables

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx... # anon key
SUPABASE_SERVICE_KEY=eyJxxx... # service_role key

# Notion OAuth
NOTION_OAUTH_CLIENT_ID=xxx
NOTION_OAUTH_CLIENT_SECRET=secret_xxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_MAX=price_xxx

# Application
BASE_URL=https://checkify.so
NODE_ENV=production

# Analytics (Optional)
POSTHOG_API_KEY=phc_xxx
UMAMI_WEBSITE_ID=uuid-xxx
```

### Environment Management

**Development:** `.env` file (gitignored)
**Production:** Platform UI (Railway/Netlify dashboard)
**Validation:** Runtime config checks in `nuxt.config.ts`

---

## Caching Strategy

### 1. Notion Data Caching

**Strategy:** Real-time fetching (no persistent cache)

**Reason:** Ensures data freshness
- Users see latest Notion changes
- No cache invalidation complexity
- Simpler architecture

**Optimization:**
- Client-side caching in TodosStore (5-minute window)
- `lastSyncAt` Map tracks fetch times
- `needsSync` getter determines refresh need

**Location:** `stores/todos.ts` lines 152-160

```typescript
needsSync: (state): boolean => {
  if (!state.currentListId) return false
  const lastSync = state.lastSyncAt.get(state.currentListId)
  if (!lastSync) return true

  // Check if >5 minutes since last sync
  const fiveMinutes = 5 * 60 * 1000
  return Date.now() - lastSync.getTime() > fiveMinutes
}
```

### 2. Database Metadata Caching

**Cached Tables:**
- `notion_database` - Database metadata
- `user_profiles` - Subscription tiers
- `todo_list` - List metadata

**Cache Duration:** Until user action or manual refresh

### 3. Static Asset Caching

**CDN Caching:**
- Images: 1 year
- JS/CSS: Versioned filenames (eternal cache)
- HTML: No cache (always fresh)

---

## Error Handling

### Server-Side Error Handling

**Utility:** `server/utils/supabase.ts`

```typescript
export function sendError(
  event: H3Event,
  code: string,
  message: string,
  statusCode: number
) {
  throw createError({
    statusCode,
    message,
    data: { code }
  })
}

// Usage
export async function getSupabaseUser(event: H3Event) {
  const user = event.context.user
  if (!user?.id) {
    sendError(event, ErrorCodes.UNAUTHORIZED, 'User not authenticated', 401)
  }
  return user
}
```

**Error Codes:** `server/constants/error-codes.ts`

```typescript
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TIER_LIMIT_EXCEEDED: 'TIER_LIMIT_EXCEEDED',
  NOTION_CONNECTION_REQUIRED: 'NOTION_CONNECTION_REQUIRED',
  NOTION_API_ERROR: 'NOTION_API_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR'
}
```

### Client-Side Error Handling

**Global Error Handler:** `error.vue`

```vue
<script setup>
const error = useError()

const errorMessage = computed(() => {
  if (error.value?.statusCode === 404) {
    return 'Page not found'
  }
  if (error.value?.statusCode === 401) {
    return 'Please sign in to continue'
  }
  return error.value?.message || 'Something went wrong'
})

function handleClearError() {
  clearError({ redirect: '/' })
}
</script>
```

**Toast Notifications:** For non-critical errors

---

## Performance Optimization

### 1. Bundle Optimization

**Nuxt Configuration:**
```typescript
export default defineNuxtConfig({
  // Tree-shaking
  experimental: {
    treeshakeClientOnly: true
  },

  // Component auto-imports
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  // Code splitting
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'notion': ['@notionhq/client'],
            'stripe': ['@stripe/stripe-js']
          }
        }
      }
    }
  }
})
```

### 2. Database Query Optimization

**Indexes:** All foreign keys and commonly queried fields

```sql
-- User lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_notion_token_user ON notion_access_token_user(user_id);

-- Notion ID lookups
CREATE INDEX idx_notion_database_id ON notion_database(notion_database_id);

-- Filtering
CREATE INDEX idx_user_profiles_tier ON user_profiles(subscription_tier);
```

**Query Patterns:**
- Use specific SELECT columns (not SELECT *)
- Apply LIMIT for pagination
- Use JOIN instead of N+1 queries

### 3. Notion API Optimization

**Pagination Utility:** `server/utils/notion-pagination.ts`

**Configuration:**
```typescript
const EXTRACTION_CONFIG = {
  maxPagesPerRequest: 100,
  maxConcurrentRequests: 15,
  requestDelayMs: 50  // 20 req/s
}
```

**Batch Processing:**
- Fetches pages in batches of 20
- Concurrent requests up to 15
- 50ms delay between requests

---

## Monitoring & Logging

### Health Check Endpoint

**Location:** `server/api/health.ts`

```typescript
export default defineEventHandler(async (event) => {
  // Check database connection
  const { error: dbError } = await supabase
    .from('user_profiles')
    .select('count')
    .limit(1)

  // Check Notion API (optional)
  // Check Stripe API (optional)

  if (dbError) {
    throw createError({
      statusCode: 503,
      message: 'Service Unavailable'
    })
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'healthy',
      notion: 'not_checked',
      stripe: 'not_checked'
    }
  }
})
```

### Logging Strategy

**Development:**
```typescript
console.log('Debug info')
consola.info('Info message')
consola.warn('Warning message')
consola.error('Error occurred')
```

**Production:**
- Structured logging via Consola
- Error tracking (Sentry recommended)
- Performance monitoring (Vercel Analytics)

---

## Database Maintenance

### Supabase Configuration

**Connection Pooling:**
- Managed by Supabase
- Automatic connection reuse
- No manual pool management needed

**Backups:**
- Automatic daily backups (Supabase)
- Point-in-time recovery available
- 30-day retention

### Migrations

**Strategy:** SQL migrations in `supabase/migrations/`

**Example:** `20250115_create_user_profiles.sql`

```sql
-- Create user profiles table
CREATE TABLE user_profiles ( ... );

-- Create trigger for auto-creation
CREATE OR REPLACE FUNCTION handle_new_user() ...
CREATE TRIGGER on_auth_user_created ...

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

**Deployment:**
- Migrations run automatically on Supabase
- Version controlled in Git
- Rollback via SQL if needed

---

## Security

### API Security

**Middleware:** `server/middleware/auth.ts`

```typescript
export default defineEventHandler(async (event) => {
  // Attach user to context
  const user = await serverSupabaseUser(event)
  event.context.user = user || undefined

  // Attach Notion auth if available
  if (user) {
    const { data } = await supabase
      .from('notion_access_token_user')
      .select()
      .eq('user_id', user.id)

    if (data.length > 0) {
      event.context.notion_auth = data[0]
    }
  }
})
```

**RLS Policies:** All user data protected

```sql
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);
```

### Secret Management

1. **Never commit secrets** - All in environment variables
2. **Service keys server-only** - Never exposed to client
3. **Rotate keys regularly** - Especially after team changes
4. **Minimal permissions** - Scope API keys appropriately

---

## Testing Infrastructure

### Unit Tests (Vitest)

**Location:** `tests/unit/`

**Run:** `pnpm test`

```typescript
describe('getUserTier', () => {
  test('returns correct limits for pro tier', async () => {
    const result = await getUserTier(proUserId)
    expect(result.tier).toBe('pro')
    expect(result.limits.maxTodoLists).toBe(10)
  })
})
```

### Integration Tests

**Location:** `tests/integration/`

**Strategy:**
- Test API endpoints end-to-end
- Use test database
- Mock external APIs (Notion, Stripe)

### E2E Tests (Playwright)

**Location:** `tests/e2e/`

**Coverage:**
- User signup flow
- Notion connection
- Todo list creation
- Subscription upgrade

---

## Disaster Recovery

### Backup Strategy

1. **Database:** Automatic Supabase backups (daily)
2. **Code:** Git repository (GitHub)
3. **Configuration:** Environment variables documented

### Recovery Procedures

**Database Corruption:**
1. Identify backup point
2. Restore from Supabase dashboard
3. Verify data integrity
4. Test critical flows

**Deployment Failure:**
1. Check build logs
2. Rollback to previous deployment
3. Fix issue locally
4. Redeploy

**API Outage:**
- Supabase down → Show maintenance message
- Notion down → Cache last known state
- Stripe down → Queue webhook events

---

## Performance Metrics

**Target Metrics:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- API Response Time: < 500ms (p95)
- Uptime: > 99.9%

**Monitoring:**
- Vercel Analytics (if on Vercel)
- Lighthouse CI
- Supabase dashboard

---

## Related Documentation
- User Stories: `planning/units/U8_infrastructure_devops.md`
- Architecture: `.claude/technical/architecture.md`
- Development Guide: `.claude/getting-started/development.md`
