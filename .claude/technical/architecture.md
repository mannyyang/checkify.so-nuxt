# Architecture Overview

This document provides a comprehensive overview of Checkify.so's system architecture, design decisions, and technical implementation details.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client (SPA)   │────▶│  Nuxt Server    │────▶│    Notion API   │
│  Vue 3 + Pinia  │     │  API Routes     │     │                 │
│                 │     │                 │     └─────────────────┘
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │    Supabase     │
                        │  - Auth         │
                        │  - Database     │
                        │                 │
                        └─────────────────┘
```

### Component Architecture

```
/
├── pages/              # File-based routing
├── layouts/            # App layouts (default, public, embed)
├── components/         # Reusable components
│   ├── ui/            # shadcn/ui components
│   │   ├── button/    # Button components
│   │   ├── card/      # Card components
│   │   ├── sidebar/   # Sidebar components
│   │   └── ...        # Other UI components
│   ├── AppSidebar.vue # Main app sidebar
│   ├── NavMain.vue    # Navigation components
│   └── ...            # App-specific components
├── server/
│   ├── api/           # API endpoints
│   └── middleware/    # Server middleware
├── stores/            # Pinia state management
├── composables/       # Vue composables
├── lib/               # Utility functions
└── plugins/           # Nuxt plugins
```

## Tech Stack Details

### Frontend
- **Framework**: Nuxt 3.8.0 (Vue 3.3.8)
- **Rendering**: SSR enabled
- **UI Library**: shadcn/ui (based on Radix UI primitives)
- **State Management**: Pinia 2.1.7
- **Styling**: Tailwind CSS v4.0.0-beta.6
- **Icons**: lucide-vue-next
- **Utilities**: class-variance-authority, clsx

### Backend
- **API Layer**: Nuxt server routes (Nitro)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **External API**: Notion API v2

### Development
- **Package Manager**: pnpm
- **Testing**: Vitest 0.34.6
- **Linting**: ESLint with Nuxt config
- **Node Version**: 18+

## Key Architectural Decisions

### 1. SSR Configuration
**Decision**: SSR enabled with client-side data fetching for todo lists

**Rationale**:
- Better SEO for landing pages and documentation
- Improved initial page load performance
- Client-side data fetching for dynamic content (todo lists)
- Maintains real-time responsiveness for todo management

**Configuration**:
```typescript
// Pages use client-side data fetching
const { data, pending, refresh } = useFetch<TodoListData>(
  '/api/todo-list/' + route.params.todo_list_id,
  {
    lazy: true,
    server: false // Client-side only
  }
);
```

### 2. Authentication Strategy
**Decision**: Dual authentication system
- Primary: Supabase Auth (Google OAuth)
- Secondary: Notion OAuth for API access

**Rationale**:
- Leverages Supabase's robust auth system
- Separate Notion OAuth allows granular permissions
- Users can revoke Notion access without losing account

### 3. Data Synchronization
**Decision**: Hybrid approach with Notion as source of truth

**Flow**:
1. Cache Notion data in Supabase for performance
2. Real-time sync for checkbox states
3. Direct Notion API calls for updates

**Rationale**:
- Balances performance with data accuracy
- Ensures changes are never lost
- Allows offline viewing (cached data)

### 4. State Management
**Decision**: Pinia for global state management

**Key Stores**:
- `data.ts` - Main application state
- `notification.ts` - Toast notifications
- User preferences and session data

**Rationale**:
- Type-safe with TypeScript
- DevTools support
- Clean API compared to Vuex

### 5. Analytics & Feature Management
**Decision**: PostHog for analytics and feature flags

**Implementation**:
- Client-side plugin (`plugins/posthog.client.ts`)
- Composable for easy access (`composables/usePostHog.ts`)
- Feature flags for controlled rollouts
- User identification on auth

**Rationale**:
- Single tool for analytics and feature flags
- Easy integration with Vue/Nuxt
- Privacy-focused with self-hosting option
- Real-time feature flag updates

## Data Flow Architecture

### Authentication Flow
```
1. User visits app
2. Redirect to /login if not authenticated
3. Google OAuth via Supabase
4. Session stored in cookies
5. Middleware validates on each request
```

### Notion Integration Flow
```
1. User clicks "Connect Notion"
2. OAuth redirect to Notion
3. Callback to /api/connect-notion
4. Token stored in Supabase
5. Available databases fetched
6. User selects databases to sync
```

### Todo Sync Flow
```
1. Fetch Notion pages from selected databases
2. Extract todo blocks from pages
3. Store in Supabase for caching
4. Display in UI with real-time updates
5. Checkbox changes sync back to Notion
```

## Security Architecture

### Authentication
- All routes protected by default
- Public routes explicitly defined in config
- Server-side session validation
- CORS configured for API routes

### Data Protection
- Service keys only on server-side
- User data isolated by Supabase RLS
- Notion tokens encrypted in database
- No client-side API keys

### API Security
- Server middleware validates all requests
- User context injected into API routes
- Rate limiting via Supabase
- Input validation on all endpoints

## Performance Considerations

### Caching Strategy
- Notion data cached in Supabase
- 15-minute cache for web fetches
- Aggressive component caching
- Static asset optimization

### Bundle Optimization
- Tree-shaking enabled
- Component auto-imports
- Lazy loading for routes
- Optimized Tailwind CSS with v4 performance improvements
- On-demand component loading for shadcn/ui

### Database Optimization
- Indexed queries on frequent lookups
- Batch operations for bulk updates
- Connection pooling via Supabase

## Scalability Design

### Horizontal Scaling
- Stateless API design
- Database handles concurrent users
- CDN for static assets
- Serverless deployment ready

### Vertical Scaling
- Efficient database queries
- Pagination for large datasets
- Progressive data loading
- Optimized bundle sizes

## Error Handling

### Client-Side
- Global error boundary
- Toast notifications for user errors
- Graceful degradation
- Retry mechanisms

### Server-Side
- Structured error responses
- Logging to console (production: external service)
- Middleware error catching
- Database transaction rollbacks

## Deployment Architecture

### Netlify Configuration
```toml
[build]
  command = "pnpm build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "18"
```

### Environment Variables
- Managed via Netlify UI
- Separate dev/staging/prod configs
- Secrets never in codebase
- Runtime validation

## Future Architecture Considerations

### Potential Improvements
1. **Real-time Updates**: WebSocket connection for live collaboration
2. **Offline Support**: Service worker for offline todo management
3. **Multi-tenant**: Support for team workspaces
4. **Plugin System**: Extensible architecture for custom integrations

### Technical Debt
1. **Type Safety**: Improve Notion API type definitions
2. **Test Coverage**: Increase unit and integration tests
3. **Documentation**: API documentation generation
4. **Monitoring**: Add APM and error tracking