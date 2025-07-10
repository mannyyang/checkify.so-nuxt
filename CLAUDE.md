# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Checkify.so** is a web application that bridges the gap between Notion's powerful organizational capabilities and the need for a focused, distraction-free todo management interface. 

### Project Goal
The primary goal is to solve a common Notion pain point: while Notion excels at organizing information, managing todos scattered across multiple pages and databases can be cumbersome. Checkify.so aggregates all your Notion todos into a single, clean interface while maintaining Notion as the source of truth.

### Key Features
- **Unified Todo View**: Aggregates todos from multiple Notion databases into one interface
- **Bidirectional Sync**: Changes made in Checkify sync back to Notion in real-time
- **Distraction-Free**: Provides a minimal UI focused solely on task management
- **Multi-Database Support**: Connect and manage todos from multiple Notion workspaces

### Technical Implementation
- **Framework**: Nuxt 3 (Vue 3) running as a SPA with SSR disabled
- **UI**: PrimeVue 3.40.x with Sakai theme + UnoCSS for styling
- **Backend**: Supabase for authentication, database, and user management
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
- [**Architecture Overview**](.claude/architecture.md) - System design, tech stack details, and architectural decisions
- [**Database Schema**](.claude/database-schema.md) - Detailed table structures, relationships, and data models
- [**Authentication Guide**](.claude/authentication.md) - Supabase auth flow, session management, and route protection
- [**Notion Integration**](.claude/notion-integration.md) - OAuth setup, API integration, and sync mechanisms

### Development Resources
- [**API Reference**](.claude/api-reference.md) - Complete documentation of all API endpoints
- [**UI Components**](.claude/ui-components.md) - Component architecture, PrimeVue patterns, and layouts
- [**Development Guide**](.claude/development.md) - Setup instructions, testing approach, and deployment

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
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=
BASE_URL=
```

Additional Notion OAuth credentials needed (see [Notion Integration](.claude/notion-integration.md) for setup).

## Development Philosophy

- **Notion as Source of Truth**: Never store critical data only in Checkify
- **Minimal UI**: Focus on task management, avoid feature creep
- **Real-time Sync**: Changes should reflect immediately in both systems
- **Privacy First**: User data stays between their Notion and their Supabase instance