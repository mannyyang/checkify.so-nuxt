# Checkify.so Changelog

All notable changes to Checkify.so are documented here.

## [Unreleased]

### Added
- **PostHog Integration**: Analytics and feature flag management
  - User identification and tracking
  - Feature flag support for controlled rollouts
  - Custom event tracking for user behavior analysis
  - `notion-database-sync` feature flag

### Changed
- Documentation reorganized into `.claude/` directory structure
- Updated sidebar UI with collapsible design
- Improved loading states throughout the application

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
- **Frontend**: Nuxt 3, Vue 3, PrimeVue, UnoCSS
- **Backend**: Supabase (Auth, Database, Realtime)
- **Integration**: Notion API v2
- **Analytics**: PostHog
- **Deployment**: Vercel/Netlify compatible

## Migration Guide

### From v1 to v2
1. Run database migrations for new schema
2. Update environment variables
3. Configure PostHog integration
4. Enable feature flags as needed

## Known Issues
- Webhook delivery can take up to 60 seconds
- Rate limiting on Notion API (3 requests/second)
- Maximum 100 pages with 100 checkboxes each per sync

## Upcoming Features
- Bulk operations for todos
- Custom filtering and sorting
- Keyboard shortcuts
- Mobile application
- Team collaboration
- AI-powered prioritization