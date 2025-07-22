# Sync to Notion Feature Documentation

This document provides comprehensive documentation for the "Sync to Notion" feature, which creates aggregated todo databases in Notion from your connected Checkify todo lists.

## Overview

The sync-to-notion feature allows users to create a centralized Notion database that aggregates all todos from their connected Notion databases. This provides a single view of all tasks while maintaining the original source databases unchanged.

### Key Benefits

- **Centralized View**: All todos from multiple databases in one place
- **Forward-Only Sync**: Preserves original databases as source of truth
- **Rich Metadata**: Includes page links, block links, and timestamps
- **Automatic Updates**: Sync on-demand to keep data current
- **Source Preservation**: Original todos remain in their source databases

## Feature Architecture

### Flow Diagram

```
Source Databases → Extract Todos → Create/Update Sync Database → Return Results
     ↑                                        ↓
  (Untouched)                           (Aggregated View)
```

### Database Schema

The sync database includes these properties:

- **Title** (title): The todo text content
- **Status** (checkbox): Whether the todo is completed
- **Page** (rich_text): The source page title
- **Page Link** (url): Direct link to the source page
- **Block Link** (url): Direct link to the specific todo block
- **Last Updated** (last_edited_time): When the todo was last synced
- **Block ID** (rich_text): The original block ID for reference

## Implementation

### Frontend Integration

The feature is accessible from the todo list detail page:

```vue
<template>
  <div class="sync-section">
    <Button
      @click="syncToNotion"
      :disabled="isSyncing"
      variant="outline"
    >
      <Icon name="lucide:database" class="w-4 h-4 mr-2" />
      {{ syncDatabaseId ? 'Update' : 'Create' }} Sync Database
    </Button>
    
    <div v-if="syncResults" class="mt-4">
      <p class="text-sm text-muted-foreground">
        Synced {{ syncResults.created + syncResults.updated }} todos
      </p>
    </div>
  </div>
</template>
```

### API Endpoint

**Endpoint**: `POST /api/todo-list/sync-to-notion`

**Request Body**:
```typescript
{
  todo_list_id: number;           // The Checkify todo list ID
  parent_page_id?: string;        // Optional parent page for the sync database
}
```

**Response**:
```typescript
{
  success: boolean;
  syncDatabaseId: string;         // Notion database ID
  syncDatabaseUrl: string;        // Direct link to the database
  syncResults: {
    created: number;              // New todos created
    updated: number;              // Existing todos updated
    errors: string[];             // Any errors encountered
    skipped: number;              // Todos skipped (no changes)
  };
  totalCheckboxes: number;        // Total todos processed
  pageCount: number;              // Number of source pages
}
```

### Backend Implementation

The backend implementation consists of several key functions:

#### Main Sync Function

```typescript
// server/api/todo-list/sync-to-notion.post.ts
export default defineEventHandler(async (event) => {
  const { todo_list_id, parent_page_id } = await readBody(event);
  
  // 1. Get or create sync database
  const syncDatabase = await getOrCreateSyncDatabase(
    todoList,
    parent_page_id,
    notionClient
  );
  
  // 2. Extract all todos from source databases
  const allTodos = await extractAllTodos(todoList, notionClient);
  
  // 3. Sync todos to the aggregated database
  const syncResults = await syncTodosToDatabase(
    allTodos,
    syncDatabase.id,
    notionClient
  );
  
  return {
    success: true,
    syncDatabaseId: syncDatabase.id,
    syncDatabaseUrl: syncDatabase.url,
    syncResults,
    totalCheckboxes: allTodos.length,
    pageCount: pages.length
  };
});
```

#### Database Creation

```typescript
async function getOrCreateSyncDatabase(
  todoList: TodoList,
  parentPageId: string | undefined,
  notion: NotionClient
) {
  // Check if sync database already exists
  if (todoList.sync_database_id) {
    try {
      const existing = await notion.databases.retrieve({
        database_id: todoList.sync_database_id
      });
      return existing;
    } catch (error) {
      // Database was deleted, create new one
    }
  }
  
  // Create new sync database
  const database = await notion.databases.create({
    parent: parentPageId ? 
      { type: 'page_id', page_id: parentPageId } : 
      { type: 'workspace', workspace: true },
    title: [
      {
        type: 'text',
        text: { content: `Checkify Sync: ${databaseName}` }
      }
    ],
    properties: {
      'Title': { title: {} },
      'Status': { checkbox: {} },
      'Page': { rich_text: {} },
      'Page Link': { url: {} },
      'Block Link': { url: {} },
      'Last Updated': { last_edited_time: {} },
      'Block ID': { rich_text: {} }
    }
  });
  
  // Store the sync database ID
  await updateTodoListSyncDatabase(todoList.id, database.id);
  
  return database;
}
```

#### Todo Extraction

```typescript
async function extractAllTodos(
  todoList: TodoList,
  notion: NotionClient
): Promise<ExtractedTodo[]> {
  const allTodos: ExtractedTodo[] = [];
  
  // Get all pages from the source database
  const pages = await getAllPagesFromDatabase(
    todoList.notion_database_id,
    notion
  );
  
  for (const page of pages) {
    // Extract todos from each page
    const pageTodos = await extractTodosFromPage(page.id, notion);
    
    // Add metadata for each todo
    const todosWithMetadata = pageTodos.map(todo => ({
      ...todo,
      pageId: page.id,
      pageTitle: getPageTitle(page),
      pageUrl: page.url,
      blockUrl: `${page.url}#${todo.id.replace(/-/g, '')}`
    }));
    
    allTodos.push(...todosWithMetadata);
  }
  
  return allTodos;
}
```

#### Database Sync

```typescript
async function syncTodosToDatabase(
  todos: ExtractedTodo[],
  syncDatabaseId: string,
  notion: NotionClient
) {
  const results = { created: 0, updated: 0, errors: [], skipped: 0 };
  
  // Get existing pages in sync database
  const existingPages = await getAllPagesFromDatabase(syncDatabaseId, notion);
  const existingByBlockId = new Map(
    existingPages.map(page => [
      getBlockIdFromPage(page),
      page
    ])
  );
  
  for (const todo of todos) {
    try {
      const existingPage = existingByBlockId.get(todo.id);
      
      if (existingPage) {
        // Update existing page if changed
        const needsUpdate = await checkIfTodoNeedsUpdate(existingPage, todo);
        if (needsUpdate) {
          await updateSyncPage(existingPage.id, todo, notion);
          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        // Create new page
        await createSyncPage(syncDatabaseId, todo, notion);
        results.created++;
      }
    } catch (error) {
      results.errors.push(`Failed to sync todo "${todo.text}": ${error.message}`);
    }
  }
  
  return results;
}
```

## User Experience

### Sync Flow

1. **Initial Setup**: User navigates to a todo list detail page
2. **Trigger Sync**: User clicks "Create Sync Database" button
3. **Location Selection**: Optional - user can specify parent page
4. **Processing**: System extracts all todos and creates/updates database
5. **Completion**: User receives confirmation with link to sync database

### UI States

- **No Sync Database**: Shows "Create Sync Database" button
- **Existing Database**: Shows "Update Sync Database" button
- **Syncing**: Shows loading state with progress indicator
- **Complete**: Shows success message with database link and stats

### Error Handling

Common error scenarios and user feedback:

- **Permission Denied**: "You don't have permission to create databases in this location"
- **Database Not Found**: "Source database no longer exists"
- **Network Error**: "Failed to connect to Notion. Please try again"
- **Partial Sync**: "Synced X of Y todos. Some todos could not be processed"

## Data Flow

### Forward-Only Sync

The sync is intentionally **forward-only**:

- Changes in source databases → reflected in sync database
- Changes in sync database → NOT reflected in source databases
- This preserves data integrity and prevents conflicts

### Change Detection

The system detects changes by comparing:

- Todo text content
- Completion status
- Last modified timestamp

Only changed todos are updated to optimize performance.

### Handling Deleted Todos

When a todo is deleted from the source:

- It remains in the sync database (for history)
- Future syncs will not update it
- Users can manually clean up old entries

## Performance Considerations

### Rate Limiting

- Notion API: 3 requests per second
- Batch operations when possible
- Implement exponential backoff for retries

### Optimization Strategies

1. **Incremental Sync**: Only update changed todos
2. **Batch Operations**: Group related API calls
3. **Caching**: Cache database schemas and metadata
4. **Error Recovery**: Continue processing after individual failures

### Scalability

- **Small Lists** (< 50 todos): Near-instant sync
- **Medium Lists** (50-200 todos): 10-30 seconds
- **Large Lists** (200+ todos): 1-3 minutes

## Testing

### Test Coverage

The feature includes comprehensive tests:

```typescript
// test/server/api/sync-to-notion.test.ts
describe('Sync to Notion API', () => {
  test('creates new sync database', async () => {
    // Test database creation flow
  });
  
  test('updates existing sync database', async () => {
    // Test update flow
  });
  
  test('handles foreign key relationships', async () => {
    // Test complex database relationships
  });
  
  test('processes todos with missing rich_text', async () => {
    // Test edge cases
  });
});
```

### Manual Testing

1. **Create sync database** with various parent page configurations
2. **Update sync database** with new/changed/deleted todos
3. **Test error scenarios** (permissions, network issues)
4. **Verify data integrity** between source and sync databases

## Security Considerations

### Permission Validation

- User must have access to source todo list
- User must have permission to create databases in target location
- All Notion operations use user's OAuth token

### Data Privacy

- No sensitive data stored outside user's Notion workspace
- All operations performed with user's credentials
- Temporary data is not cached server-side

## Limitations

### Current Limitations

1. **No Bidirectional Sync**: Changes in sync database don't sync back
2. **No Automated Scheduling**: Sync is manual only
3. **Single Database Per List**: One sync database per todo list
4. **Text-Only Content**: Rich text formatting is simplified

### Planned Improvements

1. **Scheduled Sync**: Automatic sync on Pro/Max tiers
2. **Bidirectional Sync**: Optional two-way sync for advanced users
3. **Rich Text Preservation**: Maintain formatting in sync database
4. **Filtering Options**: Sync only completed/incomplete todos

## Troubleshooting

### Common Issues

**"Database creation failed"**
- Check parent page permissions
- Verify Notion connection is active
- Try without specifying parent page

**"Some todos not synced"**
- Check individual error messages
- Verify source pages still exist
- Retry sync after fixing issues

**"Sync takes too long"**
- Large databases may take several minutes
- Check browser console for progress
- Contact support for databases with 500+ todos

### Debug Information

Enable debug mode by adding `?debug=true` to the URL:

- Shows detailed API calls
- Displays sync progress in real-time
- Logs error details to console

## Support

For additional support with the sync-to-notion feature:

- Check the [troubleshooting guide]
- Contact support with todo list ID and error details
- Include browser console output for technical issues