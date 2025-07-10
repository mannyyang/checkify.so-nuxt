# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Checkify.so is a Nuxt 3 web application that aggregates todo lists from Notion, providing a cleaner interface for managing tasks. It runs as a SPA (SSR disabled) with Supabase backend and PrimeVue UI components.

## Essential Commands

### Development
```bash
pnpm dev              # Start development server at localhost:3000
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm generate         # Generate static site
```

### Testing & Quality
```bash
pnpm lint             # Run ESLint with auto-fix
pnpm test:unit        # Run Vitest tests
pnpm test:ui          # Run tests with UI interface
pnpm test:coverage    # Generate test coverage report
```

### Running Single Tests
```bash
pnpm vitest run path/to/test.spec.ts    # Run specific test file
pnpm vitest watch path/to/test.spec.ts  # Watch mode for specific test
```

## Architecture Overview

### Tech Stack
- **Framework**: Nuxt 3 (Vue 3) with SSR disabled
- **UI**: PrimeVue 3.40.x + Sakai theme + UnoCSS
- **Database**: Supabase (PostgreSQL + Auth)
- **State**: Pinia stores
- **Forms**: FormKit with PrimeVue integration
- **i18n**: English and German support

### Key Directories
- `/server/api/` - API endpoints for Notion integration and data operations
- `/components/` - Vue components organized by feature (app/, content/, tiptap/)
- `/stores/` - Pinia stores for global state (data.ts is the main store)
- `/pages/` - File-based routing with auth middleware
- `/layouts/` - Three layouts: default (authenticated), public, embed

### Critical Patterns
1. **Authentication Flow**: Supabase auth with server middleware checking session cookies
2. **Notion Integration**: Server-side API calls to Notion using stored credentials
3. **Data Flow**: 
   - Fetch Notion pages → Store in Supabase → Display in UI
   - Checkbox state syncs bidirectionally with Notion
4. **Component Communication**: Heavy use of Pinia stores for shared state

### Environment Variables
Required in `.env`:
```
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=
BASE_URL=
```

### Database Schema
Main tables (inferred from API usage):
- `profiles` - User profiles linked to auth.users
- `notion_connections` - Stores Notion API credentials
- `pages` - Cached Notion pages
- `todos` - Individual todo items with checkbox states

### Testing Approach
- Vitest for unit tests with @nuxt/test-utils
- Tests located in `/test/` directory
- Minimal coverage currently - focus on critical paths

### Deployment
- Configured for Netlify
- Uses pnpm package manager (required)
- Node.js 18+ required