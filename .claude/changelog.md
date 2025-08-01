# Checkify.so Changelog

All notable changes to Checkify.so are documented here.

## [Unreleased] - Latest Development

### Added

- **Enhanced Landing Page with Visual Flow**
  - Added animated sync visualization showing Notion → Checkify flow
  - Interactive features demonstration
  - Improved visual hierarchy with cards and animations
  - Clear value proposition with step-by-step process

- **New Checkify Branding and Logo**
  - Created custom Checkify logo with checkbox icon
  - Updated favicon and app icons
  - Consistent brand colors throughout the application
  - Professional visual identity across all pages

- **Extraction Details Dashboard**
  - New dashboard card showing extraction metadata
  - Displays total pages processed, checkboxes found, and pages with todos
  - Real-time sync status indicators
  - Loading states with visual feedback during sync operations

- **Enhanced Sidebar Navigation System**
  - Complete redesign using shadcn/ui sidebar components
  - Responsive sidebar with mobile sheet overlay
  - Wider default width (320px) for better text visibility
  - Collapsible sidebar with icon-only mode (48px)
  - Keyboard shortcut support (Cmd/Ctrl + S)
  - Smooth transitions and accessibility compliance

- **Sync-to-Notion Feature**
  - New "Sync to Notion" functionality for creating aggregated todo databases
  - Forward-only sync from source databases to centralized view
  - Rich metadata including page links, block links, and timestamps
  - Database properties: Title, Status, Page, Page Link, Block Link, Last Updated, Block ID
  - Support for optional parent page specification
  - Handles foreign key relationships gracefully
  - Comprehensive error handling and progress reporting

- **Content Management System**
  - Nuxt Content v3 integration for documentation
  - File-based content management with Markdown support
  - Dynamic documentation routing with `/docs/[...slug].vue`
  - User guides for connecting Notion and creating todo lists
  - Server-side rendering for improved SEO

- **Enhanced Test Infrastructure**
  - Comprehensive test suite with Vitest
  - API endpoint testing for sync-to-notion functionality
  - Component testing for sidebar constants
  - Mock strategies for Notion API and Supabase
  - Coverage reporting and CI/CD preparation
  - E2E test scenarios documentation

- **Updated API Documentation**
  - New endpoints documented: `/api/pageview`, `/api/extract-tags`, `/api/extract-todos`, `/api/get-checkboxes`, `/api/set-checkbox`
  - Detailed sync-to-notion endpoint documentation with examples
  - Updated subscription tier limits in API responses
  - Added comprehensive error handling examples

### Changed

- **Updated Subscription Tiers**
  - Free tier: 25 pages (was 10), 25 checkboxes per page, 2 todo lists (was 3)
  - Pro tier: 100 pages, 100 checkboxes per page (was 200), 10 todo lists (was unlimited), daily automatic sync
  - Max tier: 500 pages, 1000 checkboxes per page, 25 todo lists (was unlimited), hourly automatic sync

- **UI Component Improvements**
  - Removed outdated PrimeVue migration documentation
  - Updated component structure to reflect sidebar system
  - Enhanced responsive design patterns
  - Improved accessibility throughout the application

- **Code Quality Enhancements**
  - Applied consistent linting and formatting across codebase
  - Better error handling in sync operations
  - Improved TypeScript type definitions
  - Enhanced debugging capabilities with debug endpoints

### Fixed

- **API Response Accuracy**
  - Corrected tier limits in API documentation to match implementation
  - Fixed Supabase foreign key expansion handling (returns objects, not arrays)
  - Improved error scenarios for missing rich_text in todo items

- **Documentation Consistency**
  - Updated all documentation to reflect current features and limits
  - Fixed outdated information in subscription tiers documentation
  - Corrected API endpoint examples and responses

### Technical Improvements

- **Architecture Updates**
  - Added content management system to architecture documentation
  - Documented sidebar component architecture
  - Enhanced error handling patterns
  - Improved scalability considerations

- **Testing Coverage**
  - Added tests for URL parsing integration
  - Database foreign key handling tests
  - Forward-only sync behavior verification
  - Error scenario coverage improvements

## [2025.07.20] - 2025-07-20

### Added

- **Complete Stripe Payment Integration**
  - Stripe checkout for new subscriptions
  - Billing portal for subscription management
  - Automatic subscription syncing on login
  - Webhook handling for real-time updates
  - Support for upgrades, downgrades, cancellations, and reactivations
  
- **Updated Pricing Structure**
  - Free tier: $0/month (25 pages, 25 checkboxes per page)
  - Pro tier: $6.99/month (100 pages, 200 checkboxes per page, webhooks)
  - Max tier: $19.99/month (500 pages, 1000 checkboxes per page, real-time sync)
  
- **Database Updates**
  - New `user_profiles` table with subscription data
  - Stripe customer ID and subscription tracking
  - Automatic profile creation on user signup
  - Row Level Security for user data protection
  
- **New API Endpoints**
  - `/api/stripe/create-checkout-session` - Initialize new subscriptions
  - `/api/stripe/create-portal-session` - Access billing management
  - `/api/stripe/webhook` - Handle Stripe events
  - `/api/stripe/cancel-subscription` - Cancel subscriptions
  - `/api/stripe/reactivate-subscription` - Reactivate cancelled subscriptions
  - `/api/stripe/update-subscription` - Change subscription plans
  - `/api/subscription` - Get current subscription status
  
- **UI Components**
  - Dedicated pricing page with tier comparison
  - Billing section in settings page
  - Subscription status indicators
  - Upgrade/downgrade flows
  
- **Development Features**
  - Debug endpoints for subscription troubleshooting
  - Test support for different subscription tiers
  - Comprehensive error handling and logging
  
### Changed

- **Tier Limits Enforcement**
  - Updated free tier checkbox limit from 50 to 25 per page
  - Enterprise tier renamed to "Max" tier
  - Added strict limit enforcement at API level
  
- **User Experience**
  - Auto-sync Stripe customer on login via `useStripeSync` composable
  - Graceful handling of subscription state mismatches
  - Clear messaging for tier limits and upgrade prompts
  
### Technical Details

- **New Files Created**:
  - `composables/useStripeSync.ts` - Auto-sync Stripe customers
  - `server/api/stripe/*` - All Stripe-related endpoints
  - `server/middleware/ensure-user-profile.ts` - Profile creation middleware
  - `test/subscription-flow.test.ts` - Subscription flow tests
  - `lib/pricing.ts` - Centralized pricing configuration
  
- **Environment Variables Added**:
  - `STRIPE_SECRET_KEY` - Stripe API key
  - `STRIPE_PUBLISHABLE_KEY` - Public Stripe key
  - `STRIPE_WEBHOOK_SECRET` - Webhook signature validation
  - `STRIPE_PRICE_ID_PRO` - Pro tier price ID
  - `STRIPE_PRICE_ID_MAX` - Max tier price ID

## [2025.07.15] - 2025-07-15

### Added

- **Subscription Tiers & Extraction Limits**
  - Implemented tier-based limits for todo extraction
  - Free tier: 25 pages max, 25 checkboxes per page, 2 todo lists
  - Pro tier: 100 pages max, 100 checkboxes per page, 10 todo lists
  - Max tier: 500 pages max, 1000 checkboxes per page, 25 todo lists  
  - Enterprise tier: Unlimited pages and checkboxes
  - Created `useSubscription` composable for tier management
  - Added tier information display in extraction metadata

- **Full Pagination Support**
  - Created `server/utils/notion-pagination.ts` with reusable pagination utilities
  - `fetchAllDatabasePages()` - Paginated database page fetching
  - `fetchAllChildBlocks()` - Paginated child block fetching
  - `processPagesInBatches()` - Batch processing for performance
  - Rate limiting with configurable delays between requests
  - No more data loss for databases larger than 60 pages

- **Comprehensive Test Suite**
  - Unit tests for pagination utilities
  - API endpoint tests with mocking
  - Integration tests for large dataset scenarios
  - E2E test scenarios documentation
  - Test utilities and mock factories

- **UI/UX Improvements**
  - Added clickable external link buttons to todo list URLs
  - Made URL input fields clickable to open in new tab
  - Added hover effects and tooltips for better interaction
  - Removed info icons for cleaner interface
  - Updated descriptions to reflect current functionality
  - Dashboard now redirects to My Todo Lists page

### Changed

- **API Updates**
  - `/api/todo-list/[todo_list_id]` now respects tier limits
  - Added metadata response with extraction details
  - Improved error handling for partial failures
  - Support for testing tiers via query parameter

- **Frontend Updates**
  - Todo list page displays extraction metadata
  - Shows current tier and limits
  - Warns when limits are reached
  - Suggests upgrades for free tier users

### Technical Details

- **New Files Created**:
  - `composables/useSubscription.ts` - Subscription tier management
  - `server/utils/notion-pagination.ts` - Pagination utilities
  - Multiple test files for comprehensive coverage

### Known Limitations

- Tier selection currently defaults to free (Stripe integration pending)
  - Test with `?tier=pro` or `?tier=enterprise` query parameter
- Rate limiting adds ~100ms delay between API requests

## [2025.07.14] - 2025-07-14

### Changed
- **MAJOR: UI Framework Migration from PrimeVue to shadcn/ui**
  - Replaced all PrimeVue components with shadcn/ui equivalents
  - Migrated from UnoCSS to Tailwind CSS v4
  - Removed FormKit dependency
  - Added lucide-vue-next for icons (replacing PrimeIcons)
  - Implemented modern component patterns with Radix UI primitives
  - Complete UI overhaul with improved accessibility and performance

- **Application Architecture Updates**
  - Re-enabled SSR with client-side data fetching for todo lists
  - Improved loading states and user experience
  - Added proper TypeScript types for all components
  - Implemented new sidebar navigation with user profile dropdown

- **UI/UX Improvements**
  - Larger, more accessible checkboxes (20x20px)
  - Inline external link icons for better usability
  - Right-side settings sidebar replacing modal sheets
  - Improved toast notifications with vue-sonner
  - Footer with Privacy Policy and Terms of Use links
  - Fixed login page with proper Google button and logo sizing

### Removed
- **PostHog Integration**: Removed analytics and feature flag management
  - Simplified codebase by removing tracking dependencies
  - Feature flags now managed through environment variables
  - Improved privacy with no external analytics

### Removed
- PrimeVue and all related dependencies
- UnoCSS styling system
- FormKit and FormKit-PrimeVue
- Sakai theme files
- Unused backup files and legacy components

### Updated
- Documentation reorganized into `.claude/` directory structure
- Updated all documentation to reflect new tech stack
- Improved development guide with shadcn/ui patterns
- Architecture documentation updated for new components

## [2024.07.14] - 2024-07-14

### Added
- **Notion Database Sync Feature**: Export aggregated todos to a new Notion database
  - Creates structured database with title, status, page links, and timestamps
  - Tracks sync history and maintains update timestamps
  - Direct links to source pages and specific checkbox blocks
  - Feature flag protected (`notion-database-sync`)

- **Webhook Integration**: Bidirectional sync support
  - Webhook endpoint (`/api/notion-webhook`) for Notion events
  - Automatic propagation of changes from synced database to original checkboxes
  - Event tracking and logging for debugging
  - Database table `notion_sync_pages` for mapping synced items

### Changed
- Updated `todo_list` table schema:
  - Added `notion_sync_database_id` column
  - Added `last_sync_date` column
  - Added webhook-related columns (`webhook_id`, `webhook_url`, `webhook_secret`)

## [2024.07.10] - 2024-07-10

### Added
- Comprehensive documentation update
  - API reference documentation
  - Architecture overview
  - Database schema documentation
  - UI components guide
  - Development setup instructions
  - Authentication flow documentation
  - Notion integration guide

### Fixed
- Fixed undefined error in checkbox handling
- Fixed empty text display in checkboxes

## [2024.07.09] - 2024-07-09

### Added
- Landing page with product overview
- Todo list creation documentation
- Connect Notion documentation
- Delete todo list functionality
- Embed API route for iframe integration

### Changed
- Updated favicon
- Improved authentication error handling
- Updated Nuxt Supabase module

### Fixed
- Fixed redirect authentication flow
- Improved error handling in API routes

## [2024.07.08] - 2024-07-08

### Added
- Association table for access tokens
- Usage tracking capabilities
- Public documentation pages

### Changed
- Updated API limits
- Small UI adjustments

## Features Overview

### Core Functionality
- **Notion Integration**: OAuth-based connection to Notion workspaces
- **Todo Aggregation**: Automatic extraction of checkboxes from Notion pages
- **Real-time Sync**: Bidirectional synchronization of checkbox states
- **Multi-database Support**: Connect multiple Notion databases
- **Progress Tracking**: Visual progress bars and completion metrics

### User Interface
- **Unified Dashboard**: All todos in one clean interface
- **Page Grouping**: Organized by source Notion page
- **Filter Options**: Show/hide completed tasks
- **Responsive Design**: Works on all devices
- **Toast Notifications**: Real-time feedback for user actions

### Technical Stack
- **Frontend**: Nuxt 3, Vue 3, shadcn/ui, Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Realtime)
- **Integration**: Notion API v2
- **Analytics**: Privacy-focused, no external tracking
- **Deployment**: Vercel/Netlify compatible

## Migration Guide

### From v1 to v2
1. Run database migrations for new schema
2. Update environment variables
3. Set up required environment variables
4. Enable feature flags as needed

## Known Issues
- Webhook delivery can take up to 60 seconds
- Rate limiting on Notion API (3 requests/second)
- Tier limits are enforced at extraction time

## Upcoming Features
- Bulk operations for todos
- Custom filtering and sorting
- Keyboard shortcuts
- Mobile application
- Team collaboration
- AI-powered prioritization