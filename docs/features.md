# Checkify.so Features Documentation

## Overview
Checkify.so is a powerful todo management tool that bridges Notion's organizational capabilities with a focused, distraction-free interface. This document outlines all current features and recent updates.

## Core Features

### 1. Notion Integration
- **OAuth Authentication**: Secure connection to Notion workspaces
- **Multi-Database Support**: Connect multiple Notion databases simultaneously
- **Real-time Sync**: Bidirectional synchronization between Checkify and Notion
- **Todo Extraction**: Automatically finds and aggregates all checkbox items from connected pages

### 2. Todo Management Interface
- **Unified View**: All todos from multiple Notion pages in one clean interface
- **Interactive Checkboxes**: Click to check/uncheck with instant Notion sync
- **Page Grouping**: Todos organized by their source Notion page
- **Progress Tracking**: Visual progress bars and completion percentages
- **Filter Options**: Toggle to show/hide completed tasks

### 3. Database Sync Feature
- **Create Sync Database**: Export aggregated todos to a new Notion database
- **Structured Properties**: Includes title, status, source page, links, and timestamps
- **Update Tracking**: Maintains sync history and last update times
- **Direct Links**: Quick access to both source pages and specific checkbox blocks

### 4. Webhook Support (Beta)
- **Bidirectional Updates**: Changes in synced Notion database update original checkboxes
- **Automatic Processing**: Webhook handler manages update propagation
- **Event Tracking**: Logs all webhook events for debugging

## Recent Updates

### PostHog Integration (NEW)
- **Feature Flag Support**: Control feature rollout with PostHog flags
- **Analytics Ready**: Track user interactions and feature usage
- **User Identification**: Automatic user tracking for authenticated sessions

### Feature Flag Implementation
- **notion-database-sync**: Controls visibility of Notion sync features
- **Dynamic UI**: Features hidden/shown based on flag status
- **Real-time Updates**: Feature flags checked on component mount

### UI Improvements
- **Sidebar Design**: Collapsible sidebar with settings and sync options
- **Loading States**: Clear feedback during sync operations
- **Toast Notifications**: Success/error messages for user actions
- **Responsive Layout**: Works seamlessly on desktop and mobile

### Performance Enhancements
- **Lazy Loading**: Todo lists load on demand
- **Caching**: Reduced API calls with smart caching
- **Batch Operations**: Efficient checkbox updates

## Technical Features

### API Endpoints
- `/api/todo-list/*`: Todo list management
- `/api/set-checkbox`: Update checkbox states
- `/api/sync-to-notion`: Create/update sync database
- `/api/notion-webhook`: Handle bidirectional sync events

### Database Schema
- **todo_list**: Stores list metadata and sync information
- **notion_auth**: Manages Notion OAuth tokens
- **sync_page_mapping**: Tracks synced pages and blocks
- **webhook_events**: Logs incoming webhook data

### Security
- **Supabase Authentication**: Secure user management
- **Token Encryption**: Notion tokens stored securely
- **Row Level Security**: Users only access their own data
- **Webhook Validation**: Ensures webhook events are legitimate

## Configuration

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key
BASE_URL=https://your-domain.com
```

### PostHog Setup
```javascript
// Configured in plugins/posthog.client.ts
posthog.init('your_project_key', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only'
})
```

## Usage Guide

### Getting Started
1. Sign in with Google via Supabase Auth
2. Connect your Notion workspace
3. Select databases to track
4. View and manage all todos in one place

### Creating a Sync Database
1. Open a todo list
2. Click the settings icon
3. Select "Sync to Notion Database"
4. Provide a parent page ID (first time only)
5. Click "Create & Sync"

### Managing Feature Flags
1. Access PostHog dashboard
2. Create/modify feature flags
3. Target specific users or percentages
4. Changes reflect immediately in app

## Roadmap

### Planned Features
- Bulk operations for todos
- Custom filtering and sorting
- Keyboard shortcuts
- Mobile app
- Team collaboration features
- AI-powered task prioritization

### In Development
- Enhanced webhook security
- Performance optimizations
- Advanced analytics dashboard
- Export capabilities

## Support

For issues or feature requests:
- GitHub: [Create an issue](https://github.com/your-repo/issues)
- Documentation: Check `/docs` folder
- API Reference: See `.claude/api-reference.md`