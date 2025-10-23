# Unit 8: Infrastructure & DevOps

## Epic Overview
Deploy, monitor, and maintain the application infrastructure with proper caching, error handling, and performance optimization.

**Status:** 🟢 Completed
**Priority:** High
**Dependencies:** All other units (foundational infrastructure)

---

## User Stories

### U8-S1: Reliable Platform Deployment
**As a** developer
**I want** the app deployed on a reliable platform
**So that** users have consistent uptime

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] App deployed on production-grade platform (Netlify/Vercel)
- [ ] Automatic deployments from main branch
- [ ] Preview deployments for pull requests
- [ ] Zero-downtime deployments
- [ ] Rollback capability if needed
- [ ] 99.9%+ uptime target

**Platform:** Railway, Netlify, or Vercel

**Technical Implementation:**
- Git-based deployment workflow
- Build command: `pnpm build`
- Output directory: `.output/public`
- Node.js 18+ runtime
- Automatic SSL certificates

---

### U8-S2: Secure Environment Variables
**As a** developer
**I want** environment variables securely managed
**So that** secrets aren't exposed

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] All secrets stored in platform UI
- [ ] Separate variables for dev/staging/prod
- [ ] No secrets in Git repository
- [ ] Runtime validation of required variables
- [ ] Deployment fails if required vars missing
- [ ] .env.example provided for developers

**Required Environment Variables:**
```
# Supabase
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=

# Notion OAuth
NOTION_OAUTH_CLIENT_ID=
NOTION_OAUTH_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_MAX=

# Analytics (optional)
POSTHOG_API_KEY=
UMAMI_WEBSITE_ID=

# App
BASE_URL=
NODE_ENV=production
```

**Technical Implementation:**
- Platform environment variable management
- Runtime config in Nuxt
- Server-side only keys use SUPABASE_SERVICE_KEY
- Public keys exposed via `nuxt.config.ts`

---

### U8-S3: Server-Side Rendering (SSR)
**As a** user
**I want** fast page loads through SSR
**So that** I have a good experience

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Landing pages rendered server-side
- [ ] SEO meta tags generated
- [ ] Initial page load < 2 seconds
- [ ] Progressive enhancement for JavaScript
- [ ] Works with JavaScript disabled (basic functionality)
- [ ] Optimized Time to First Byte (TTFB)

**SSR Strategy:**
```
Static Pages (SSG):
- Landing page
- Pricing page
- Documentation

Server-Side Rendered (SSR):
- Public pages with dynamic content

Client-Side Rendered (CSR):
- Dashboard (authenticated)
- Todo lists (dynamic data)
```

**Technical Implementation:**
- Nuxt SSR enabled by default
- Client-side data fetching for dynamic content
- Static generation for marketing pages

---

### U8-S4: Notion Data Caching
**As a** developer
**I want** Notion data cached in Supabase
**So that** API rate limits aren't exceeded

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Pages cached in database
- [ ] Todos cached in database
- [ ] Cache invalidation on manual refresh
- [ ] Stale data indicated to users
- [ ] Reduces Notion API calls by 90%+
- [ ] Respects Notion rate limits (3 req/sec)

**Caching Strategy:**
```
1. Initial Extraction:
   - Fetch from Notion API
   - Store in Supabase
   - Display from cache

2. Subsequent Views:
   - Load from Supabase cache
   - Show last sync time
   - Offer manual refresh

3. Checkbox Toggles:
   - Update Notion immediately
   - Update cache after success
   - Optimistic UI update
```

**Technical Implementation:**
- `page` and `todo` tables as cache
- `last_sync_date` tracks freshness
- Manual refresh re-queries Notion

---

### U8-S5: Error Handling and Logging
**As a** developer
**I want** proper error handling and logging
**So that** I can debug issues quickly

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] All API errors caught and logged
- [ ] User-friendly error messages
- [ ] Error codes for categorization
- [ ] Stack traces in development
- [ ] Structured logging in production
- [ ] Error monitoring (Sentry/similar)

**Error Categories:**
```
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Validation errors (400)
- Server errors (500)
- External API errors (Notion, Stripe)
```

**Technical Implementation:**
- Try-catch blocks in all API routes
- Error handler middleware
- Consola for structured logging
- Error responses with `{ error: { code, message } }`

---

### U8-S6: Automated Testing
**As a** developer
**I want** automated testing with Vitest
**So that** I can catch bugs before deployment

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Unit tests for utility functions
- [ ] Component tests for UI
- [ ] API route tests for endpoints
- [ ] Test coverage > 60%
- [ ] Tests run in CI/CD pipeline
- [ ] Failing tests block deployment

**Test Coverage:**
```
- Utility functions (lib/*)
- Pinia stores (stores/*)
- API routes (server/api/*)
- Vue components (components/*)
```

**Technical Implementation:**
- Vitest test runner
- `pnpm test` runs all tests
- `pnpm test:ui` for interactive testing
- `pnpm test:coverage` for coverage reports

---

### U8-S7: Code Quality Tools
**As a** developer
**I want** linting and code quality tools
**So that** code remains maintainable

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] ESLint configured with Nuxt rules
- [ ] TypeScript strict mode enabled
- [ ] Pre-commit hooks run linting
- [ ] Consistent code formatting
- [ ] No console.log in production
- [ ] Import ordering enforced

**Tools:**
```
- ESLint: Linting
- TypeScript: Type checking
- Prettier: Formatting (optional)
- Husky: Git hooks (optional)
```

**Technical Implementation:**
- `pnpm lint` runs ESLint
- `nuxt.config.ts` TypeScript configuration
- ESLint auto-fix on save

---

### U8-S8: Database Query Optimization
**As a** user
**I want** database queries optimized with indexes
**So that** the app performs well at scale

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] All foreign keys indexed
- [ ] Commonly queried fields indexed
- [ ] Query plans analyzed
- [ ] N+1 queries avoided
- [ ] Pagination for large datasets
- [ ] Connection pooling configured

**Critical Indexes:**
```sql
-- User lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_notion_token_user ON notion_access_token_user(user_id);
CREATE INDEX idx_todo_list_user ON todo_list(user_id);

-- Notion ID lookups
CREATE INDEX idx_notion_database_id ON notion_database(notion_database_id);
CREATE INDEX idx_page_block_id ON page(notion_block_id);
CREATE INDEX idx_todo_block_id ON todo(notion_block_id);

-- Relationship lookups
CREATE INDEX idx_todo_page ON todo(notion_page_id);
CREATE INDEX idx_page_parent ON page(notion_parent_id);

-- Filtering
CREATE INDEX idx_todo_checked ON todo(checked);
```

**Technical Implementation:**
- Indexes created in migrations
- Supabase connection pooling
- Query batching where possible
- Lazy loading for large lists

---

## Technical Architecture

### Components

#### 1. DeploymentPipeline
**Stages:**
1. **Build**
   - Install dependencies (`pnpm install`)
   - Run type checking (`npx nuxi typecheck`)
   - Run linting (`pnpm lint`)
   - Run tests (`pnpm test`)
   - Build application (`pnpm build`)

2. **Deploy**
   - Upload build artifacts
   - Set environment variables
   - Deploy to production/staging
   - Health check

3. **Verify**
   - Smoke tests
   - Monitor for errors
   - Rollback if issues detected

---

#### 2. CachingStrategy
**Layers:**
1. **Database Cache** (Supabase)
   - Notion pages and todos
   - Long-term storage
   - Manual invalidation

2. **HTTP Cache** (Browser)
   - Static assets
   - CDN caching
   - Cache headers

3. **Application Cache** (Memory)
   - User session data
   - Subscription tier
   - Temporary state

---

#### 3. MonitoringService
**Metrics:**
- **Performance**
  - Response times
  - Database query times
  - External API latency

- **Errors**
  - Error rates by endpoint
  - Failed API calls
  - User-reported issues

- **Business**
  - Active users
  - Todo lists created
  - Subscription conversions

---

## Infrastructure Diagram

```
                   ┌─────────────┐
                   │   CDN       │
                   │  (Static)   │
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │   Netlify   │
                   │   /Vercel   │
                   └──────┬──────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
   │  Supabase   │ │   Notion   │ │   Stripe   │
   │  (Database) │ │    API     │ │   API      │
   └─────────────┘ └────────────┘ └────────────┘
```

---

## Deployment Configuration

### Netlify/Vercel
```toml
[build]
  command = "pnpm build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Docker (Alternative)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

---

## Monitoring & Alerts

### Health Checks
```
GET /api/health
Response: { "status": "ok", "timestamp": "..." }

Checks:
- Database connection
- Notion API reachable
- Stripe API reachable
```

### Error Alerts
```
Triggers:
- Error rate > 5% for 5 minutes
- Response time > 2s for 50% of requests
- Database connection failures
- External API timeouts

Notifications:
- Email to dev team
- Slack channel alert
- PagerDuty (if critical)
```

---

## Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading components
- Image optimization
- CSS minification
- Tree-shaking

### Backend
- Database connection pooling
- Query optimization
- Indexed lookups
- Batch operations
- Caching frequently accessed data

### Network
- CDN for static assets
- Gzip compression
- HTTP/2 enabled
- Minimal payload sizes

---

## Disaster Recovery

### Backup Strategy
1. **Database Backups**
   - Automated daily backups (Supabase)
   - Point-in-time recovery available
   - 30-day retention

2. **Code Repository**
   - Git version control (GitHub)
   - Protected main branch
   - All changes via pull requests

3. **Configuration**
   - Environment variables documented
   - Infrastructure as code
   - Deployment scripts versioned

### Recovery Procedures
1. **Database Corruption**
   - Restore from latest backup
   - Verify data integrity
   - Test critical flows

2. **Deployment Failure**
   - Rollback to previous version
   - Investigate build logs
   - Fix and redeploy

3. **External API Outage**
   - Serve cached data
   - Show degraded mode message
   - Queue operations for retry

---

## Testing Scenarios

### Test Case 1: Deployment Pipeline
1. Push code to GitHub
2. Verify CI/CD pipeline triggers
3. Verify tests run and pass
4. Verify build succeeds
5. Verify deployment to staging
6. Verify health check passes

### Test Case 2: Environment Variables
1. Remove required env var
2. Attempt deployment
3. Verify build fails
4. Verify error message clear
5. Add env var back
6. Verify deployment succeeds

### Test Case 3: Database Performance
1. Create 1000+ todos
2. Query todo list
3. Verify response time < 500ms
4. Check database query plan
5. Verify indexes used

### Test Case 4: Error Handling
1. Simulate Notion API error
2. Verify error caught
3. Verify user sees friendly message
4. Verify error logged
5. Verify retry option available

### Test Case 5: Cache Invalidation
1. Create todo list (cached)
2. Make change in Notion directly
3. Click "Refresh" in app
4. Verify cache updated
5. Verify Notion changes reflected

---

## Security Considerations

### Infrastructure Security
- HTTPS enforced
- Secure headers (CSP, HSTS, etc.)
- DDoS protection via CDN
- Rate limiting on APIs
- Input validation

### Application Security
- Row Level Security (RLS)
- Server-side authorization checks
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized output)
- CSRF protection

### Data Security
- Encrypted at rest (Supabase)
- Encrypted in transit (HTTPS)
- No secrets in codebase
- Principle of least privilege
- Regular security audits

---

## Maintenance Tasks

### Daily
- Monitor error rates
- Check system health
- Review failed operations

### Weekly
- Review performance metrics
- Analyze user feedback
- Update dependencies (if needed)

### Monthly
- Database maintenance (vacuum, analyze)
- Security updates
- Backup verification
- Cost optimization review

### Quarterly
- Major dependency upgrades
- Infrastructure review
- Disaster recovery drill
- Performance audit

---

## Related Documentation
- [Architecture Overview](.claude/technical/architecture.md)
- [Database Schema](.claude/technical/database-schema.md)
- [Development Guide](.claude/getting-started/development.md)
