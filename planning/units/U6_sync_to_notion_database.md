# Unit 6: Sync to Notion Database

## Epic Overview
Create a centralized Notion database aggregating all todos from multiple databases for comprehensive tracking.

**Status:** 🟢 Completed
**Priority:** High
**Dependencies:** U3 (Todo Management), U2 (Notion Integration)

---

## User Stories

### U6-S1: Create Sync Database in Notion
**As a** user
**I want to** create a dedicated Notion database with all my todos
**So that** I have a single source of truth in Notion

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Sync to Notion Database"
- [ ] System creates new database in Notion workspace
- [ ] Database has structured properties (title, source page, status, etc.)
- [ ] All existing todos are synced to new database
- [ ] Success message with link to new database
- [ ] Database ID stored for future syncs

**Technical Implementation:**
- `/api/todo-list/sync-to-notion` POST endpoint
- Notion API `databases.create()` called
- Properties schema defined for todo tracking
- Pages created for each todo

---

### U6-S2: Todo Metadata in Sync Database
**As a** user
**I want** each todo synced with metadata
**So that** I have full context in the aggregated database

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Todo text as page title
- [ ] Source page title property
- [ ] Source page URL property
- [ ] Source database property
- [ ] Checked/unchecked status property
- [ ] Created date property
- [ ] Link back to original Notion page

**Database Properties:**
```
- Title (title): Todo text
- Source Page (rich_text): Original page title
- Source URL (url): Link to original page
- Source Database (select): Which database it came from
- Status (checkbox): Checked/unchecked
- Created (date): When todo was created
- Original Block ID (rich_text): For reference
```

**Technical Implementation:**
- Properties defined in database creation
- Each todo becomes a page with properties populated
- URLs constructed from Notion page IDs

---

### U6-S3: Manual Sync Trigger
**As a** user
**I want to** trigger a manual sync to my Notion database
**So that** I can update it on demand

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] "Sync Now" button visible in UI
- [ ] Click triggers full resync
- [ ] Progress indicator shows sync status
- [ ] New todos added to database
- [ ] Changed todos updated
- [ ] Removed todos deleted from sync database
- [ ] Success message on completion

**Technical Implementation:**
- Button calls sync API endpoint
- Compares current todos with synced pages
- Creates, updates, or archives pages as needed
- Updates `last_sync_date` in todo_list

---

### U6-S4: Sync Status Display
**As a** user
**I want to** see sync status and last sync time
**So that** I know when my Notion database was updated

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Last sync time displayed
- [ ] Format: "Last synced X minutes ago"
- [ ] Shows "Never synced" if not yet synced
- [ ] Syncing indicator during active sync
- [ ] Error status if sync failed
- [ ] Link to synced database

**Technical Implementation:**
- `last_sync_date` from todo_list table
- Reactive timestamp formatting
- Loading state during sync operation
- Error handling with user-friendly messages

---

### U6-S5: Links to Original Pages
**As a** user
**I want** synced pages to maintain links to original Notion pages
**So that** I can navigate to source content

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Source URL property contains valid Notion link
- [ ] Click opens original Notion page
- [ ] URLs remain valid even if todo changes
- [ ] Breadcrumb shows database → page hierarchy
- [ ] Easy navigation between sync DB and source

**Technical Implementation:**
- Notion page URLs constructed: `https://notion.so/{page_id}`
- Stored in URL property type
- Clickable in Notion interface

---

### U6-S6: Extraction Metadata Storage
**As a** user
**I want** extraction metadata stored with my sync
**So that** I can track what was processed

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Total todos synced count
- [ ] Sync database ID stored
- [ ] Last sync timestamp
- [ ] Errors logged (if any)
- [ ] Available in UI for troubleshooting

**Technical Implementation:**
- `notion_sync_database_id` stored in todo_list
- `last_sync_date` updated on each sync
- Metadata viewable in list settings

---

## Technical Architecture

### Components

#### 1. NotionSyncService
**Attributes:**
- `notion` (Client): Notion API client
- `supabase` (SupabaseClient): Database client
- `accessToken` (string): User's Notion token

**Behaviors:**
- `createSyncDatabase()`: Create aggregated database in Notion
- `syncTodos()`: Sync todos to database
- `updateSyncedPage()`: Update existing synced page
- `deleteSyncedPage()`: Remove from sync database
- `getDatabaseSchema()`: Define properties for sync DB

**Business Rules:**
- One sync database per todo list
- Maintains bidirectional links
- Handles sync conflicts (last write wins)

---

#### 2. NotionSyncPages (Table)
**Attributes:**
- `id` (uuid, PK): Record identifier
- `todo_list_id` (uuid, FK): Reference to todo list
- `sync_database_id` (string): Notion database ID
- `page_id` (string): Notion page ID in sync database
- `block_id` (string): Original checkbox block ID
- `created_at` (timestamp): Record creation
- `updated_at` (timestamp): Last update

**Behaviors:**
- `track()`: Record synced page mapping
- `findByBlockId()`: Get synced page for checkbox
- `updateTimestamp()`: Mark as synced

**Business Rules:**
- Unique constraint on page_id
- Cascade delete with todo_list
- Tracks mapping between original and synced

---

## Component Interactions

### Initial Sync Database Creation
```
User clicks "Sync to Notion Database"
  ↓
POST /api/todo-list/sync-to-notion
  ↓
Check if sync database already exists
  ↓
If not exists:
  notion.databases.create({
    parent: { type: "page_id", page_id: user_workspace_root },
    title: "Checkify - Aggregated Todos",
    properties: {
      "Title": { type: "title" },
      "Source Page": { type: "rich_text" },
      "Source URL": { type: "url" },
      "Source Database": { type: "select" },
      "Status": { type: "checkbox" },
      "Created": { type: "date" },
      "Original Block ID": { type: "rich_text" }
    }
  })
  ↓
Store sync_database_id in todo_list
  ↓
For each todo in list:
  notion.pages.create({
    parent: { database_id: sync_database_id },
    properties: {
      "Title": todo.block_text,
      "Source Page": page.block_text,
      "Source URL": `https://notion.so/${page.notion_block_id}`,
      "Status": todo.checked,
      ...
    }
  })
  ↓
  Store mapping in notion_sync_pages
  ↓
Update last_sync_date
  ↓
Return success with database URL
```

### Subsequent Sync Operations
```
User clicks "Sync Now"
  ↓
POST /api/todo-list/sync-to-notion
  ↓
Retrieve sync_database_id from todo_list
  ↓
Fetch all current todos from database
  ↓
Fetch all synced pages from notion_sync_pages
  ↓
Compare:
  - New todos → Create pages in sync DB
  - Existing todos with changes → Update pages
  - Removed todos → Archive pages in sync DB
  ↓
For each new todo:
  notion.pages.create({ ... })
  Insert into notion_sync_pages
  ↓
For each changed todo:
  notion.pages.update({
    page_id: synced_page_id,
    properties: { updated_properties }
  })
  Update notion_sync_pages.updated_at
  ↓
For each removed todo:
  notion.pages.update({
    page_id: synced_page_id,
    archived: true
  })
  Delete from notion_sync_pages
  ↓
Update last_sync_date
  ↓
Return sync summary
```

---

## Database Schema

### todo_list (Sync Fields)
```sql
ALTER TABLE todo_list
ADD COLUMN notion_sync_database_id TEXT,
ADD COLUMN last_sync_date TIMESTAMP WITH TIME ZONE;
```

### notion_sync_pages
```sql
CREATE TABLE notion_sync_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_list_id BIGINT NOT NULL REFERENCES todo_list(todo_list_id) ON DELETE CASCADE,
  sync_database_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_id)
);

CREATE INDEX idx_sync_pages_page_id ON notion_sync_pages(page_id);
CREATE INDEX idx_sync_pages_todo_list ON notion_sync_pages(todo_list_id);
CREATE INDEX idx_sync_pages_block_id ON notion_sync_pages(block_id);
```

---

## API Endpoints

### POST /api/todo-list/sync-to-notion
**Description:** Create or update Notion sync database

**Request:**
```json
{
  "todo_list_id": "123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sync_database_id": "database-uuid-123",
    "sync_database_url": "https://notion.so/database-uuid-123",
    "todos_synced": 45,
    "last_sync_date": "2024-01-15T12:00:00Z"
  }
}
```

---

## Notion Database Schema

### Sync Database Properties
```javascript
{
  "Title": {
    "type": "title",
    "title": {}
  },
  "Source Page": {
    "type": "rich_text",
    "rich_text": {}
  },
  "Source URL": {
    "type": "url",
    "url": {}
  },
  "Source Database": {
    "type": "select",
    "select": {
      "options": [
        { "name": "Personal Tasks", "color": "blue" },
        { "name": "Work Projects", "color": "green" }
      ]
    }
  },
  "Status": {
    "type": "checkbox",
    "checkbox": {}
  },
  "Created": {
    "type": "date",
    "date": {}
  },
  "Original Block ID": {
    "type": "rich_text",
    "rich_text": {}
  }
}
```

### Sample Synced Page
```javascript
{
  "parent": { "database_id": "sync-db-uuid" },
  "properties": {
    "Title": {
      "title": [{ "text": { "content": "Complete design review" } }]
    },
    "Source Page": {
      "rich_text": [{ "text": { "content": "Project Alpha" } }]
    },
    "Source URL": {
      "url": "https://notion.so/page-uuid-123"
    },
    "Source Database": {
      "select": { "name": "Work Projects" }
    },
    "Status": {
      "checkbox": false
    },
    "Created": {
      "date": { "start": "2024-01-15" }
    },
    "Original Block ID": {
      "rich_text": [{ "text": { "content": "block-uuid-456" } }]
    }
  }
}
```

---

## Testing Scenarios

### Test Case 1: Initial Sync
1. Create todo list with 10 todos
2. Click "Sync to Notion Database"
3. Verify database created in Notion
4. Verify all 10 todos present as pages
5. Verify properties populated correctly
6. Verify source URLs are clickable

### Test Case 2: Incremental Sync
1. Have existing sync database
2. Add 5 new todos in Checkify
3. Click "Sync Now"
4. Verify 5 new pages created
5. Verify existing pages unchanged
6. Verify last sync time updated

### Test Case 3: Update Sync
1. Have existing sync database
2. Check off 3 todos in Checkify
3. Click "Sync Now"
4. Verify status updated in sync database
5. Verify pages still exist
6. Verify metadata preserved

### Test Case 4: Remove Sync
1. Have existing sync database
2. Delete todo list in Checkify
3. Verify cascade delete of sync mappings
4. Verify sync database remains in Notion (not deleted)

---

## Future Enhancements

### Bidirectional Sync (Webhook-based)
- Notion webhooks notify Checkify of changes
- Changes in sync database reflect in Checkify
- Conflict resolution strategies
- Real-time sync instead of manual

### Advanced Properties
- Tags from Notion properties
- Priority levels
- Assignees (for collaboration)
- Custom fields

---

## Related Documentation
- [Notion Integration](.claude/features/notion-integration.md)
- [API Reference](.claude/technical/api-reference.md)
- [Database Schema](.claude/technical/database-schema.md)
