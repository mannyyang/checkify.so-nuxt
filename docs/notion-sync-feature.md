# Notion Database Sync Feature

## Overview
This feature allows users to sync their aggregated checkboxes from Checkify to a new Notion database. This creates a centralized view of all todos across different Notion pages in a single Notion database.

**Note**: This feature is currently controlled by the `notion-database-sync` PostHog feature flag and may not be available to all users.

## How It Works

1. **Aggregation**: The system collects all checkbox items from the connected Notion pages
2. **Database Creation**: On first sync, creates a new Notion database with the following properties:
   - Title (text): The checkbox text
   - Status (checkbox): Current checked state
   - Page (text): Name of the source page
   - Page Link (URL): Link to the source page
   - Block Link (URL): Direct link to the checkbox block
   - Last Updated (date): Timestamp of last sync
   - Block ID (text): For tracking and updates

3. **Sync Process**: 
   - Updates existing entries if they already exist
   - Creates new entries for new checkboxes
   - Maintains bidirectional sync capability

## User Interface

### Sync Button
Located in the sidebar when viewing a todo list:
- Shows "Sync to Notion Database" button
- Displays last sync date if previously synced
- Shows link to view the sync database in Notion

### First-Time Setup
On first sync, users need to provide:
- Parent Page ID: The Notion page where the database will be created
- This can be found in the Notion URL after the workspace name

## API Endpoint

**POST** `/api/todo-list/sync-to-notion`

Request body:
```json
{
  "todo_list_id": "string",
  "parent_page_id": "string (optional)"
}
```

Response:
```json
{
  "success": true,
  "syncDatabaseId": "string",
  "syncResults": {
    "created": 0,
    "updated": 0,
    "errors": []
  },
  "totalCheckboxes": 0
}
```

## Database Schema Changes

Added columns to `todo_list` table:
- `notion_sync_database_id`: Stores the ID of the created Notion database
- `last_sync_date`: Timestamp of the last successful sync

## Benefits

1. **Centralized View**: All todos from multiple pages in one Notion database
2. **Notion Features**: Use Notion's native filtering, sorting, and views
3. **Collaboration**: Share the sync database with team members
4. **Analytics**: Create dashboards and reports from the aggregated data
5. **Maintains Source of Truth**: Original checkboxes remain the primary source

## Technical Details

- Uses Notion API v2022-06-28
- Creates database as a subpage of specified parent
- Handles up to 100 pages with 100 checkboxes each per sync
- Updates are tracked using Block ID to prevent duplicates