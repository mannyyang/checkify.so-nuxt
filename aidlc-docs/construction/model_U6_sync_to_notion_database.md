# Domain Model: U6 - Sync to Notion Database

## Overview
Creates a centralized Notion database aggregating all todos from multiple databases for comprehensive tracking.

**Related User Stories:** See `planning/units/U6_sync_to_notion_database.md`

---

## Purpose

Solves the problem: "I have todos scattered across multiple Notion databases. I want one place in Notion to see everything."

**Solution:** Create a new Notion database where each page represents a todo, with properties linking back to source pages.

---

## Domain Components

### 1. Sync Database Creator

**Location:** `server/api/todo-list/sync-to-notion.post.ts`

**Purpose:** Creates and populates aggregated Notion database

**Database Properties:**
```typescript
{
  "Title": { type: "title" },             // Todo text
  "Source Page": { type: "rich_text" },  // Original page title
  "Source URL": { type: "url" },         // Link to original page
  "Source Database": { type: "select" }, // Which database
  "Status": { type: "checkbox" },        // Checked/unchecked
  "Created": { type: "date" },           // Creation date
  "Original Block ID": { type: "rich_text" } // For reference
}
```

**Implementation Flow:**
```typescript
export default defineEventHandler(async (event) => {
  const { todoListId } = await readBody(event)
  const { notion_auth } = event.context

  // 1. Check if sync database exists
  let syncDatabaseId = await getSyncDatabaseId(todoListId)

  if (!syncDatabaseId) {
    // 2. Create new database in Notion
    const database = await notion.databases.create({
      parent: { type: "page_id", page_id: workspaceRootPage },
      title: [{ text: { content: "Checkify - Aggregated Todos" } }],
      properties: { /* defined above */ }
    })

    syncDatabaseId = database.id

    // 3. Store database ID
    await supabase
      .from('todo_list')
      .update({ notion_sync_database_id: syncDatabaseId })
      .eq('todo_list_id', todoListId)
  }

  // 4. Fetch all todos from Checkify's view
  const todos = await fetchTodosForList(todoListId)

  // 5. Create/update pages in sync database
  for (const todo of todos) {
    await notion.pages.create({
      parent: { database_id: syncDatabaseId },
      properties: {
        "Title": { title: [{ text: { content: todo.text } }] },
        "Source Page": { rich_text: [{ text: { content: todo.pageTitle } }] },
        "Source URL": { url: `https://notion.so/${todo.pageId}` },
        "Status": { checkbox: todo.checked },
        "Created": { date: { start: todo.createdAt } },
        "Original Block ID": { rich_text: [{ text: { content: todo.blockId } }] }
      }
    })
  }

  // 6. Update last sync date
  await supabase
    .from('todo_list')
    .update({ last_sync_date: new Date().toISOString() })
    .eq('todo_list_id', todoListId)

  return {
    success: true,
    syncDatabaseId,
    todosSynced: todos.length
  }
})
```

---

### 2. NotionSyncPages (Tracking Table)

**Table:** `notion_sync_pages`

**Purpose:** Maps original checkboxes to synced pages

**Schema:**
```sql
CREATE TABLE notion_sync_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_list_id BIGINT NOT NULL REFERENCES todo_list(todo_list_id) ON DELETE CASCADE,
  sync_database_id TEXT NOT NULL,
  page_id TEXT NOT NULL,         -- Page in sync database
  block_id TEXT NOT NULL,        -- Original checkbox block
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_id)
);

CREATE INDEX idx_sync_pages_page_id ON notion_sync_pages(page_id);
CREATE INDEX idx_sync_pages_todo_list ON notion_sync_pages(todo_list_id);
CREATE INDEX idx_sync_pages_block_id ON notion_sync_pages(block_id);
```

**Usage:**
- Track which sync page corresponds to which original checkbox
- Enable incremental updates (only sync changed todos)
- Support deletion of removed todos

---

### 3. TodoList (Sync Fields)

**Additional Attributes:**
- `notion_sync_database_id` (TEXT) - ID of created sync database
- `last_sync_date` (TIMESTAMP) - Last sync timestamp

---

## Component Interactions

### Initial Sync Flow

```
User clicks "Sync to Notion Database"
  ↓
POST /api/todo-list/sync-to-notion { todoListId }
  ↓
Check: Does sync database exist?
  ├─ NO → Create database in Notion
  │        Store database ID in todo_list
  ↓
  └─ YES → Use existing database ID
  ↓
Fetch all todos for this list
  (Queries Notion API in real-time)
  ↓
For each todo:
  ┌─────────────────────────────────┐
  │ Create page in sync database:   │
  │ - Title: todo text              │
  │ - Source Page: original page    │
  │ - Source URL: link to original  │
  │ - Status: checkbox state        │
  │ - Track mapping in              │
  │   notion_sync_pages table       │
  └─────────────────────────────────┘
  ↓
Update last_sync_date
  ↓
Return success + database URL
```

### Incremental Sync Flow

```
User clicks "Sync Now" (subsequent sync)
  ↓
Retrieve sync_database_id from todo_list
  ↓
Fetch current todos from Notion
  ↓
Fetch synced page mappings from notion_sync_pages
  ↓
Compare:
  - New todos → Create pages
  - Changed todos → Update pages
  - Removed todos → Archive pages
  ↓
For new todos:
  notion.pages.create({ ... })
  INSERT into notion_sync_pages
  ↓
For changed todos:
  notion.pages.update({
    page_id: mapped_page_id,
    properties: { updated_values }
  })
  UPDATE notion_sync_pages.updated_at
  ↓
For removed todos:
  notion.pages.update({
    page_id: mapped_page_id,
    archived: true
  })
  DELETE from notion_sync_pages
  ↓
Update last_sync_date
```

---

## API Endpoints

### POST /api/todo-list/sync-to-notion

**Request:**
```json
{
  "todoListId": "123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "syncDatabaseId": "database-uuid",
    "syncDatabaseUrl": "https://notion.so/database-uuid",
    "todosSynced": 45,
    "lastSyncDate": "2024-01-15T12:00:00Z"
  }
}
```

---

## Business Rules

1. **One Sync Database Per List:** Each todo list can have its own sync database
2. **Manual Sync:** User triggers sync (no automatic background sync)
3. **Incremental Updates:** Only changed todos updated on subsequent syncs
4. **Bidirectional Links:** Sync database pages link back to originals
5. **Preserved on Delete:** Sync database NOT deleted when Checkify list deleted

---

## Sync Database Structure (in Notion)

**Example Page:**
```
Title: "Complete design review"
Source Page: "Project Alpha"
Source URL: https://notion.so/page-uuid-123
Source Database: "Work Tasks"
Status: ☐ (unchecked)
Created: January 15, 2024
Original Block ID: block-uuid-456
```

**Properties Benefits:**
- Filter by source database
- Sort by status
- Search by page title
- Click URL to jump to original
- See creation dates

---

## Performance Considerations

1. **Batch Operations:** Pages created in batches to reduce API calls
2. **Pagination:** Handles large todo lists with pagination
3. **Rate Limiting:** Respects Notion's API rate limits (50ms delay)
4. **Incremental Sync:** Only syncs changes, not full refresh

---

## Future Enhancements

1. **Bidirectional Sync:** Changes in sync database update original
2. **Webhook Integration:** Real-time sync via Notion webhooks
3. **Custom Properties:** User-defined properties in sync database
4. **Scheduled Sync:** Automatic daily/hourly sync for paid tiers

---

## Related Documentation
- User Stories: `planning/units/U6_sync_to_notion_database.md`
- Database Schema: `.claude/technical/database-schema.md`
- Notion Integration: `.claude/features/notion-integration.md`
