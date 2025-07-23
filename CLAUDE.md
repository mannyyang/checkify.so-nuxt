# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Checkify.so** is a web application that bridges the gap between Notion's powerful organizational capabilities and the need for a focused, distraction-free todo management interface. 

### Project Goal
The primary goal is to solve a common Notion pain point: while Notion excels at organizing information, managing todos scattered across multiple pages and databases can be cumbersome. Checkify.so aggregates all your Notion todos into a single, clean interface while maintaining Notion as the source of truth.

### Key Features
- **Unified Todo View**: Aggregates todos from multiple Notion databases into one interface
- **Bidirectional Sync**: Changes made in Checkify sync back to Notion in real-time
- **Sync to Notion Database**: Create a centralized Notion database with all your todos
- **Webhook Integration**: Support for bidirectional sync via webhooks
- **Distraction-Free**: Provides a minimal UI focused solely on task management
- **Multi-Database Support**: Connect and manage todos from multiple Notion workspaces
- **Subscription Tiers**: Free, Pro ($6.99/mo), and Max ($19.99/mo) plans with different limits
- **Automatic Sync**: Daily (Pro) or hourly (Max) automatic synchronization
- **Billing Management**: Integrated Stripe payments and subscription management

### Technical Implementation
- **Framework**: Nuxt 3 (Vue 3) with SSR enabled
- **UI**: shadcn/ui component library with Tailwind CSS v4
- **Backend**: Supabase for authentication, database, and user management
- **Payments**: Stripe for subscription billing and management
- **Integration**: Notion API v2 for reading and updating todo blocks

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

## Documentation Structure

For detailed information about specific aspects of the codebase, refer to the following documentation files in the `.claude/` directory:

### Core Documentation
- [**Architecture Overview**](.claude/technical/architecture.md) - System design, tech stack details, and architectural decisions
- [**Database Schema**](.claude/technical/database-schema.md) - Detailed table structures, relationships, and data models
- [**Authentication Guide**](.claude/getting-started/authentication.md) - Supabase auth flow, session management, and route protection
- [**Notion Integration**](.claude/features/notion-integration.md) - OAuth setup, API integration, and sync mechanisms
- [**Stripe Integration**](.claude/features/stripe-integration.md) - Payment processing and subscription management
- [**Subscription Tiers**](.claude/features/subscription-tiers.md) - Pricing plans and tier limits

### Development Resources
- [**API Reference**](.claude/technical/api-reference.md) - Complete documentation of all API endpoints
- [**UI Components**](.claude/technical/ui-components.md) - Component architecture, shadcn/ui patterns, and layouts
- [**Development Guide**](.claude/getting-started/development.md) - Setup instructions, testing approach, and deployment
- [**Quickstart Guide**](.claude/getting-started/quickstart.md) - Get up and running quickly

## Quick Architecture Summary

```
User → Nuxt 3 SPA → Supabase Auth → Google OAuth
                  ↓
            Authenticated
                  ↓
         Connect Notion → Notion OAuth
                  ↓
     Select Notion Databases → Store in Supabase
                  ↓
    Fetch & Display Todos ← → Bidirectional Sync with Notion
```

## Critical Patterns

1. **Authentication**: All routes except public pages require Supabase authentication
2. **Data Flow**: Notion → Supabase (cache) → UI, with real-time sync for checkboxes
3. **State Management**: Heavy reliance on Pinia stores for global state
4. **API Design**: Server-side API routes handle all Notion communication

## Environment Requirements

Required environment variables in `.env`:
```
# Supabase
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=
BASE_URL=

# Notion OAuth (required for Notion integration)
NOTION_OAUTH_CLIENT_ID=
NOTION_OAUTH_CLIENT_SECRET=

# Stripe (required for subscriptions)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_MAX=
```

See [Notion Integration](.claude/features/notion-integration.md) for detailed Notion OAuth setup instructions.

## Development Philosophy

- **Notion as Source of Truth**: Never store critical data only in Checkify
- **Minimal UI**: Focus on task management, avoid feature creep
- **Real-time Sync**: Changes should reflect immediately in both systems
- **Privacy First**: User data stays between their Notion and their Supabase instance