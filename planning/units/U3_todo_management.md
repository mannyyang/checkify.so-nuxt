# Unit 3: Todo Management

## Epic Overview
Extract, display, filter, and manage todos from connected Notion databases in a unified interface.

**Status:** 🟢 Completed
**Priority:** High
**Dependencies:** U2 (Notion Integration)

---

## User Stories

### U3-S1: Create Todo List from Notion Database
**As a** user
**I want to** create a todo list from a Notion database
**So that** I can view all my todos in one place

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can select a Notion database to create a todo list
- [ ] System extracts all pages from the selected database
- [ ] System extracts all checkbox blocks from each page
- [ ] Todo list is created and stored in database
- [ ] User is redirected to the new todo list
- [ ] Extraction metadata is captured (page count, checkbox count, errors)

**Technical Implementation:**
- `/api/todo-list` POST endpoint creates new list
- Notion API queries database for pages
- Recursive block extraction finds all checkboxes
- Data stored in `todo_list`, `page`, and `todo` tables

---

### U3-S2: View Pages from Database
**As a** user
**I want to** see all pages from my selected database
**So that** I can navigate to specific todos

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Pages displayed with titles and icons
- [ ] Pages sorted by creation/edit date
- [ ] Page count shown in UI
- [ ] User can expand/collapse pages
- [ ] Empty pages (no todos) are still shown

**Technical Implementation:**
- Pages fetched from `page` table
- Linked to parent database via `notion_parent_id`
- UI component displays hierarchical structure

---

### U3-S3: View Checkbox Blocks
**As a** user
**I want to** see all checkbox blocks extracted from my Notion pages
**So that** I can manage my tasks

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] All checkboxes displayed under their parent pages
- [ ] Checkbox text rendered correctly
- [ ] Checked/unchecked state visible
- [ ] Nested checkboxes properly indented
- [ ] Link to original Notion page available

**Technical Implementation:**
- Todos fetched from `todo` table
- Filtered by `notion_page_id`
- Checkbox component renders state
- Notion block ID enables sync

---

### U3-S4: View Todos Organized by Page
**As a** user
**I want to** view my todos organized by page
**So that** I maintain context from Notion

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Todos grouped under their parent pages
- [ ] Page title displayed as section header
- [ ] Collapse/expand functionality per page
- [ ] Visual hierarchy matches Notion structure
- [ ] Page metadata (creation date, URL) accessible

**Technical Implementation:**
- JOIN query on `page` and `todo` tables
- UI groups by `notion_page_id`
- Collapsible components for pages

---

### U3-S5: Search and Filter Todos
**As a** user
**I want to** search and filter my todos
**So that** I can find specific tasks quickly

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Search box filters todos by text
- [ ] Filter by checked/unchecked status
- [ ] Filter by tags (if present)
- [ ] Filter by priority (if present)
- [ ] Filters can be combined
- [ ] Search is case-insensitive

**Technical Implementation:**
- Pinia store handles filtering logic
- `filteredTodos` getter applies filters
- Client-side filtering for performance

---

### U3-S6: View Todo Metadata
**As a** user
**I want to** see todo metadata (tags, priority, due dates)
**So that** I can manage tasks effectively

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Tags extracted from Notion properties
- [ ] Priority levels displayed
- [ ] Due dates shown (if present)
- [ ] Metadata updates when Notion changes
- [ ] Visual indicators for metadata (colors, icons)

**Technical Implementation:**
- Metadata stored in `notion_block` jsonb field
- Parser extracts properties from Notion API response
- UI components render metadata visually

---

### U3-S7: Delete Todo List
**As a** user
**I want to** delete a todo list
**So that** I can remove databases I no longer want to track

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Delete" on todo list
- [ ] Confirmation dialog prevents accidental deletion
- [ ] All associated pages and todos are deleted
- [ ] User redirected to dashboard after deletion
- [ ] Success message displayed

**Technical Implementation:**
- `/api/todo-list/[id]` DELETE endpoint
- Cascade delete removes related records
- Pinia store updates local state

---

### U3-S8: View Extraction Metadata
**As a** user
**I want to** see extraction metadata (total pages, checkboxes found)
**So that** I understand what was synced

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Total pages scanned displayed
- [ ] Total checkboxes found displayed
- [ ] Pages with todos count shown
- [ ] Extraction errors listed (if any)
- [ ] Tier limits shown
- [ ] Extraction timestamp visible

**Technical Implementation:**
- Metadata stored in `todo_list.extraction_metadata` jsonb
- UI displays summary statistics
- Errors logged and displayed to user

---

## Technical Architecture

### Components

#### 1. TodoList
**Attributes:**
- `todo_list_id` (bigint, PK): List identifier
- `user_id` (uuid, FK → auth.users): Owner
- `notion_database_id` (string, FK → notion_database): Source database
- `extraction_metadata` (jsonb): Extraction details
- `notion_sync_database_id` (string, nullable): Sync database ID
- `last_sync_date` (timestamp, nullable): Last sync time
- `created_at` (timestamp): Creation time

**Behaviors:**
- `create()`: Create new todo list from database
- `extract()`: Extract todos from Notion pages
- `delete()`: Remove list and associated data
- `updateMetadata()`: Store extraction results

**Business Rules:**
- One list per user-database combination
- Respects tier limits for extraction
- Cascade delete removes pages and todos

#### 2. Page
**Attributes:**
- `page_id` (bigint, PK): Page identifier
- `notion_block` (jsonb): Complete page object from Notion
- `block_text` (string): Page title
- `notion_block_id` (string, unique): Notion's page ID
- `notion_parent_id` (string): Parent database ID
- `notion_parent_type` (string): Parent type (database_id)
- `notion_created_time` (timestamp): Page creation in Notion
- `created_at` (timestamp): Record creation

**Behaviors:**
- `fetchFromNotion()`: Get page data from API
- `extractTodos()`: Find all checkbox blocks
- `getTitle()`: Parse title from properties

**Business Rules:**
- Unique constraint on `notion_block_id`
- Linked to parent database
- Stores complete Notion page object

#### 3. Todo
**Attributes:**
- `todo_id` (bigint, PK): Todo identifier
- `notion_block` (jsonb): Complete block object from Notion
- `block_text` (string): Checkbox text content
- `notion_block_id` (string, unique): Notion's block ID
- `notion_page_id` (string): Parent page ID
- `notion_parent_id` (string): Direct parent block/page ID
- `notion_parent_type` (string): Parent type (page_id, block_id)
- `checked` (boolean): Checkbox state
- `created_at` (timestamp): Record creation

**Behaviors:**
- `toggle()`: Change checked state
- `syncToNotion()`: Update Notion with new state
- `extractMetadata()`: Parse tags, priority from block

**Business Rules:**
- Unique constraint on `notion_block_id`
- Linked to parent page
- Checkbox state syncs bidirectionally

#### 4. TodosStore (Pinia)
**Attributes:**
- `lists` (TodoList[]): All user's todo lists
- `todos` (Map<string, Todo[]>): Todos by list ID
- `currentListId` (string | null): Active list
- `filter` (TodoFilter): Active filters
- `isLoading` (boolean): Loading state
- `error` (string | null): Error message

**Behaviors:**
- `fetchLists()`: Load all user's lists
- `fetchTodos()`: Load todos for specific list
- `updateTodo()`: Optimistically update todo
- `setFilter()`: Apply search/filter criteria
- `deleteList()`: Remove todo list

---

## Component Interactions

### Todo List Creation Flow
```
User selects Notion database
  ↓
POST /api/todo-list { notion_database_id }
  ↓
Check tier limits (max pages, checkboxes)
  ↓
Query Notion API for database pages
  ↓
For each page:
  - Fetch page blocks recursively
  - Extract all checkbox blocks
  - Store page in `page` table
  - Store todos in `todo` table
  ↓
Store extraction metadata
  ↓
Create todo_list record
  ↓
Return success with metadata
  ↓
Redirect user to new todo list
```

### Todo Extraction Flow
```
notion.databases.query({ database_id })
  ↓
Get list of pages (up to tier limit)
  ↓
For each page:
  notion.blocks.children.list({ block_id: page.id })
  ↓
  For each block:
    - If type === 'to_do': extract and store
    - If has_children: recurse into children
  ↓
Aggregate metadata:
  - totalPages
  - totalCheckboxes
  - pagesWithTodos
  - errors (if any)
  ↓
Store in todo_list.extraction_metadata
```

### Filtering Flow
```
User types in search box / selects filter
  ↓
TodosStore.setFilter({ searchQuery, checked, tags })
  ↓
filteredTodos getter recomputes:
  1. Filter by checked state
  2. Filter by tags
  3. Filter by search query (text, page title, tags)
  4. Sort by sortBy field (createdAt, priority, etc.)
  ↓
UI reactively updates with filtered todos
```

---

## Database Schema

### todo_list
```sql
CREATE TABLE todo_list (
    todo_list_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notion_database_id VARCHAR NOT NULL REFERENCES notion_database(notion_database_id),
    extraction_metadata JSONB,
    notion_sync_database_id TEXT,
    last_sync_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notion_database_id)
);

CREATE INDEX idx_todo_list_user ON todo_list(user_id);
CREATE INDEX idx_todo_list_database ON todo_list(notion_database_id);
```

**Extraction Metadata:**
```json
{
  "totalPages": 45,
  "totalCheckboxes": 120,
  "pagesWithTodos": 15,
  "errors": [],
  "tierLimits": {
    "maxPages": 100,
    "maxCheckboxesPerPage": 100
  },
  "extractedAt": "2024-01-15T12:00:00Z"
}
```

### page
```sql
CREATE TABLE page (
    page_id BIGSERIAL PRIMARY KEY,
    notion_block JSONB NOT NULL,
    block_text VARCHAR,
    notion_block_id VARCHAR NOT NULL UNIQUE,
    notion_parent_id VARCHAR,
    notion_parent_type VARCHAR,
    notion_created_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_page_block_id ON page(notion_block_id);
CREATE INDEX idx_page_parent ON page(notion_parent_id);
```

### todo
```sql
CREATE TABLE todo (
    todo_id BIGSERIAL PRIMARY KEY,
    notion_block JSONB NOT NULL,
    block_text VARCHAR,
    notion_block_id VARCHAR NOT NULL UNIQUE,
    notion_page_id VARCHAR,
    notion_parent_id VARCHAR,
    notion_parent_type VARCHAR,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_todo_block_id ON todo(notion_block_id);
CREATE INDEX idx_todo_page ON todo(notion_page_id);
CREATE INDEX idx_todo_checked ON todo(checked);
```

---

## API Endpoints

### POST /api/todo-list
**Description:** Create new todo list from Notion database

**Request:**
```json
{
  "notion_database_id": "database-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "todo_list": {
      "todo_list_id": "123",
      "notion_database_id": "database-uuid",
      "extraction_metadata": { ... }
    }
  }
}
```

---

### GET /api/todo-list
**Description:** Get all user's todo lists

**Response:**
```json
{
  "data": {
    "todo_lists": [
      {
        "todo_list_id": "123",
        "notion_database_id": "database-uuid",
        "created_at": "2024-01-15T12:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/todo-list/[id]
**Description:** Get specific todo list with all todos

**Response:**
```json
{
  "data": {
    "todo_list": { ... },
    "pages": [
      {
        "page_id": "1",
        "block_text": "Project Alpha",
        "todos": [
          {
            "todo_id": "10",
            "block_text": "Complete design",
            "checked": false
          }
        ]
      }
    ]
  }
}
```

---

### DELETE /api/todo-list/[id]
**Description:** Delete todo list and all associated data

**Response:**
```json
{
  "success": true,
  "message": "Todo list deleted successfully"
}
```

---

## Testing Scenarios

### Test Case 1: Create Todo List
1. Connect Notion and select database
2. Click "Create Todo List"
3. Verify extraction progress shown
4. Verify redirect to new list
5. Verify pages and todos displayed
6. Verify extraction metadata shown

### Test Case 2: View Todos
1. Open existing todo list
2. Verify pages grouped correctly
3. Verify todos displayed under pages
4. Verify checkbox states match Notion
5. Verify page titles and icons shown

### Test Case 3: Search Todos
1. Open todo list
2. Type search query
3. Verify matching todos shown
4. Verify non-matching hidden
5. Clear search shows all todos again

### Test Case 4: Delete Todo List
1. Click "Delete" on todo list
2. Verify confirmation dialog
3. Confirm deletion
4. Verify redirect to dashboard
5. Verify list removed from database

---

## Related Documentation
- [Architecture Overview](.claude/technical/architecture.md)
- [Database Schema](.claude/technical/database-schema.md)
- [API Reference](.claude/technical/api-reference.md)
