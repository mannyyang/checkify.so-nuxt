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

### 📊 Privacy-Focused Analytics
- **No External Tracking**: Your data stays private
- **Local Analytics Only**: Usage metrics stored in your own database
- **Privacy First**: No third-party analytics services

### 💎 Subscription Tiers (NEW)
- **Free Tier**: 25 pages, 25 checkboxes per page, 2 todo lists
- **Pro Tier ($6.99/mo)**: 100 pages, 100 checkboxes per page, 10 todo lists
- **Max Tier ($19.99/mo)**: 500 pages, 1000 checkboxes per page, 25 todo lists
- **Smart Limits**: Clear feedback when limits are reached
- **Upgrade Prompts**: Contextual suggestions for tier upgrades

## Recent Updates

### Enhanced Dashboard (NEW)
- Extraction details card showing processing metadata
- Loading states with visual feedback
- Real-time sync status indicators
- Tier limit warnings and upgrade prompts

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
- [Sync to Notion Feature](./sync-to-notion-feature.md)