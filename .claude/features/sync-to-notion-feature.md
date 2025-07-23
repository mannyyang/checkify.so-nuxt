# Sync to Notion Database Feature

## Overview

The "Sync to Notion Database" feature allows users to create a centralized Notion database containing all their todos from across multiple pages. This provides a unified view of all tasks while maintaining the original source pages.

## How It Works

### Forward-Only Sync
This feature creates a **one-way sync** from your todo lists to a new Notion database:
- Changes in source pages update the sync database
- Changes in the sync database **do not** sync back to source pages
- The sync database serves as a read-only aggregated view

### Database Creation
When you trigger a sync:
1. A new Notion database is created (or existing one is updated)
2. Each todo becomes a database entry with rich metadata
3. Links are preserved to original pages and blocks
4. Checkbox states are synchronized

### Database Properties
The sync database includes these properties for each todo:
- **Title** (title) - The todo text
- **Status** (checkbox) - Whether the todo is completed
- **Page** (rich_text) - The page title where the todo is located
- **Page Link** (url) - Direct link to the source page
- **Block Link** (url) - Direct link to the specific todo block
- **Last Updated** (last_edited_time) - When the todo was last synced
- **Block ID** (rich_text) - The original block ID for reference

## User Interface

### Triggering a Sync
1. Navigate to your todo list
2. Click the "Sync to Notion Database" button
3. (Optional) Provide a parent page URL where the database should be created
4. Click "Create Sync Database" or "Update Sync Database"

### Sync Status
- Progress indicators show sync progress
- Success/error messages provide feedback
- The sync database URL is displayed after creation

## API Implementation

### Endpoint
`POST /api/todo-list/sync-to-notion`

### Request Body
```json
{
  "todo_list_id": 123,
  "parent_page_id": "notion-page-uuid"  // Optional
}
```

### Response
```json
{
  "success": true,
  "syncDatabaseId": "notion-database-uuid",
  "syncDatabaseUrl": "https://notion.so/...",
  "syncResults": {
    "created": 10,
    "updated": 5,
    "errors": [],
    "skipped": 0
  },
  "totalCheckboxes": 15,
  "pageCount": 8
}
```

## Webhook Integration

### Overview
For advanced users, the sync database can be configured with webhooks to enable bidirectional sync or custom automations.

### Setup
1. Configure a webhook URL in your todo list settings
2. When todos change, Checkify posts updates to your webhook
3. Your webhook endpoint can then update other systems

### Webhook Payload
```json
{
  "event": "todo.updated",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "todo_id": "block-uuid",
    "todo_text": "Complete project documentation",
    "checked": true,
    "page_id": "page-uuid",
    "page_title": "Project Alpha",
    "sync_database_id": "database-uuid"
  }
}
```

### Use Cases
- Sync to other task management tools
- Trigger automations (Zapier, Make, IFTTT)
- Update project management systems
- Send notifications
- Create reports

## Benefits

### Organization
- See all todos from multiple pages in one place
- Filter and sort todos using Notion's database views
- Create custom views for different contexts

### Tracking
- Monitor todo completion across projects
- Track when todos were last updated
- Maintain audit trail of changes

### Integration
- Use Notion's powerful database features
- Create formulas and rollups
- Build dashboards
- Connect to other Notion databases

## Limitations

### One-Way Sync
- Changes in the sync database don't update source pages
- This is by design to prevent conflicts
- Source pages remain the single source of truth

### API Limits
- Subject to Notion API rate limits
- Large todo lists may take time to sync
- Tier limits apply to total todos synced

### Permissions
- Requires access to create databases in Notion
- Parent page must be shared with the integration
- Some workspace restrictions may apply

## Best Practices

### Regular Syncs
- Sync regularly to keep database current
- Use automatic sync (Pro/Max tiers) for best results
- Monitor sync status for errors

### Database Management
- Organize sync databases by project or context
- Use Notion's database views for filtering
- Archive old sync databases when no longer needed

### Performance
- For large todo lists, sync during off-peak hours
- Monitor API usage to avoid rate limits
- Use parent pages to organize multiple sync databases

## Troubleshooting

### Common Issues

**"Parent page not found"**
- Ensure the page exists and is shared with your Notion integration
- Check that you're using the correct page URL/ID

**"Insufficient permissions"**
- Verify your Notion integration has create access
- Check workspace settings for restrictions

**"Sync failed"**
- Check for Notion API outages
- Verify your subscription tier limits
- Review error messages for specific issues

### Getting Help
- Check the [API Reference](../technical/api-reference.md#post-apitodo-listsync-to-notion)
- Review [Notion Integration](./notion-integration.md) setup
- Contact support@checkify.so for assistance