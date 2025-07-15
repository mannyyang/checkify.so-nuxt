# Checkify.so Features Overview

## What is Checkify.so?

Checkify.so is a powerful todo management tool that bridges Notion's organizational capabilities with a focused, distraction-free interface. It aggregates all your Notion todos into a single, clean interface while maintaining Notion as the source of truth.

## Core Features

### 📝 Todo Management
- **Unified View**: All todos from multiple Notion pages in one clean interface
- **Interactive Checkboxes**: Click to check/uncheck with instant Notion sync
- **Page Grouping**: Todos organized by their source Notion page
- **Progress Tracking**: Visual progress bars and completion percentages
- **Filter Options**: Toggle to show/hide completed tasks

### 🔗 Notion Integration
- **OAuth Authentication**: Secure connection to Notion workspaces
- **Multi-Database Support**: Connect multiple Notion databases simultaneously
- **Real-time Sync**: Bidirectional synchronization between Checkify and Notion
- **Todo Extraction**: Automatically finds and aggregates all checkbox items

### 🗄️ Database Sync (Feature Flag Protected)
- **Export to Notion**: Create a new Notion database with all aggregated todos
- **Structured Properties**: Title, status, source page, links, and timestamps
- **Update Tracking**: Maintains sync history and last update times
- **Direct Links**: Quick access to both source pages and specific checkbox blocks

### 🔄 Webhook Support
- **Bidirectional Updates**: Changes in synced Notion database update original checkboxes
- **Automatic Processing**: Webhook handler manages update propagation
- **Event Tracking**: Logs all webhook events for debugging

### 📊 Analytics & Feature Management
- **PostHog Integration**: Track user interactions and feature usage
- **Feature Flags**: Control feature rollout dynamically
- **User Identification**: Automatic user tracking for authenticated sessions

### 💎 Subscription Tiers (NEW)
- **Free Tier**: 10 pages, 50 checkboxes per page, 3 todo lists
- **Pro Tier ($9/mo)**: 100 pages, 200 checkboxes per page, unlimited lists
- **Enterprise Tier ($29/mo)**: Unlimited everything, API access, priority support
- **Smart Limits**: Clear feedback when limits are reached
- **Upgrade Prompts**: Contextual suggestions for tier upgrades

## Recent Updates

### PostHog Integration (NEW)
- Feature flag support for controlled rollouts
- Analytics tracking for user behavior
- `notion-database-sync` flag controls sync feature visibility

### UI Improvements
- Collapsible sidebar with settings and sync options
- Toast notifications for user feedback
- Responsive design for all devices
- Loading states for better UX

### Performance Enhancements
- Lazy loading for todo lists
- Smart caching to reduce API calls
- Batch operations for checkbox updates

## Key Benefits

1. **Distraction-Free**: Focus on tasks without Notion's complexity
2. **Centralized**: All todos from across your Notion workspace in one place
3. **Real-time**: Changes sync instantly between Checkify and Notion
4. **Flexible**: Use Notion's features when needed, simple interface when not
5. **Secure**: Your data stays between you, Notion, and your Supabase instance

## Related Documentation

- [Notion Integration Details](./notion-integration.md)
- [Database Sync Feature](./notion-sync-feature.md)
- [Webhook Setup](./webhook-integration.md)
- [PostHog Integration](./posthog-integration.md)