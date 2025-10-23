# Domain Model: U3 - Todo Management

## Overview
This domain model defines the components, attributes, behaviors, and interactions for extracting, displaying, filtering, and managing todos from connected Notion databases.

**Related User Stories:** See `planning/units/U3_todo_management.md`

---

## Domain Components

### 1. TodoList (Domain Entity)

#### Purpose
Represents a connection between a user and a Notion database for todo extraction and management.

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `todoListId` | BigInt | Yes | Generated | List identifier (primary key) |
| `userId` | UUID | Yes | - | Owner reference (FK → auth.users) |
| `notionDatabaseId` | String | Yes | - | Source Notion database (FK → notion_database) |
| `extractionMetadata` | JSONB | No | null | Details about last extraction |
| `notionSyncDatabaseId` | String | No | null | ID of sync database if created |
| `lastSyncDate` | Timestamp | No | null | Last sync timestamp |
| `createdAt` | Timestamp | Yes | NOW() | Creation time |

#### Extraction Metadata Structure
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

#### Behaviors

**create(userId, databaseId)** - Creates new todo list
- Validates user has access to database
- Checks tier limits for max todo lists
- Initiates todo extraction
- Returns created list with extraction metadata

**Actual Implementation (server/api/todo-list/index.post.ts):**
```typescript
export default defineEventHandler(async (event) => {
  const { user, notion_auth } = event.context
  const body = await readBody(event)

  // Get user tier and limits
  const { tier, limits } = await getUserTier(user.id)

  // Check if user can create more lists
  const { count } = await supabase
    .from('todo_list')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count >= limits.maxTodoLists) {
    throw createError({
      statusCode: 403,
      message: `You've reached the maximum number of todo lists (${limits.maxTodoLists}) for your ${tier} plan`
    })
  }

  // Extract todos from Notion
  const extraction = await extractTodosFromDatabase(
    body.id,
    notion_auth.access_token,
    limits
  )

  // Create todo list record
  const { data } = await supabase.from('todo_list').insert({
    user_id: user.id,
    notion_database_id: body.id,
    extraction_metadata: extraction.metadata
  })

  return { todo_list: data[0] }
})
```

**delete(todoListId)** - Removes todo list and cascades
- Deletes from todo_list table
- Cascades to pages and todos via foreign keys
- Returns success status

**getExtractionMetadata()** - Returns extraction details
- Parses JSONB metadata
- Returns structured object

#### Business Rules

1. **One List Per Database Per User:** UNIQUE constraint on (user_id, notion_database_id)
2. **Tier Limits Enforced:** Max lists checked before creation
3. **Cascade Delete:** Removing list deletes all associated pages and todos
4. **Metadata Required:** Extraction metadata always captured

---

### 2. Page (Domain Entity)

#### Purpose
Represents a cached Notion page that contains todo items.

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pageId` | BigInt | Yes | Generated | Page identifier (primary key) |
| `notionBlock` | JSONB | Yes | - | Complete page object from Notion |
| `blockText` | String | No | null | Page title (extracted) |
| `notionBlockId` | String | Yes | - | Notion's page UUID (unique) |
| `notionParentId` | String | No | null | Parent database/page ID |
| `notionParentType` | String | No | null | Parent type (database_id, page_id) |
| `notionCreatedTime` | Timestamp | No | null | Page creation time in Notion |
| `createdAt` | Timestamp | Yes | NOW() | Record creation time |

#### Notion Block Structure
```json
{
  "id": "page-uuid-123",
  "object": "page",
  "created_time": "2024-01-01T00:00:00.000Z",
  "last_edited_time": "2024-01-02T00:00:00.000Z",
  "parent": {
    "type": "database_id",
    "database_id": "database-uuid"
  },
  "properties": {
    "Name": {
      "title": [{"plain_text": "Project Alpha"}]
    }
  }
}
```

#### Behaviors

**extractFromNotion(pageObject)** - Stores page from Notion API
- Parses page title from properties
- Stores complete Notion object as JSONB
- Extracts parent information
- Returns stored page record

**Actual Implementation (server/api/extract-todos.ts):**
```typescript
// Extract page title
function getPageTitle(page: PageObjectResponse): string {
  const titleProperty = Object.keys(page?.properties).find(
    key => page.properties[key].type === 'title'
  )

  return titleProperty
    ? page.properties[titleProperty].title[0].plain_text
    : ''
}

// Store page
const pagesToInsert = pages.map(pageBlock => {
  const page = pageBlock as PageObjectResponse
  const title = getPageTitle(page)
  const parent_type = page.parent.type
  const parent_id = page.parent[parent_type]

  return {
    notion_block: page,
    block_text: title,
    notion_block_id: page.id,
    notion_parent_id: parent_id,
    notion_parent_type: parent_type,
    notion_created_time: page.created_time
  }
})

await supabase.from('page').insert(pagesToInsert)
```

**getTitle()** - Extracts plain text title
- Parses properties.title array
- Returns first plain_text value

#### Business Rules

1. **Unique Page IDs:** UNIQUE constraint on notion_block_id
2. **Complete Storage:** Full Notion page object preserved
3. **Indexed Lookups:** notion_block_id and notion_parent_id indexed
4. **No Updates:** Pages are immutable once stored (recreated on refresh)

---

### 3. Todo (Domain Entity)

#### Purpose
Represents an individual checkbox/todo item extracted from a Notion page.

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `todoId` | BigInt | Yes | Generated | Todo identifier (primary key) |
| `notionBlock` | JSONB | Yes | - | Complete block object from Notion |
| `blockText` | String | No | null | Todo text content |
| `notionBlockId` | String | Yes | - | Notion's block UUID (unique) |
| `notionPageId` | String | No | null | Parent page ID |
| `notionParent Id` | String | No | null | Direct parent block/page ID |
| `notionParentType` | String | No | null | Parent type (page_id, block_id) |
| `checked` | Boolean | Yes | false | Checkbox state |
| `createdAt` | Timestamp | Yes | NOW() | Record creation time |

#### Notion Block Structure
```json
{
  "id": "block-uuid-456",
  "object": "block",
  "type": "to_do",
  "to_do": {
    "rich_text": [{"plain_text": "Complete design review"}],
    "checked": false,
    "color": "default"
  },
  "parent": {
    "type": "page_id",
    "page_id": "page-uuid-123"
  }
}
```

#### Behaviors

**extractFromBlock(block)** - Creates todo from Notion block
- Validates block type is 'to_do'
- Extracts text from rich_text array
- Captures checked state
- Stores complete block as JSONB
- Returns todo record

**Actual Implementation (server/api/extract-todos.ts):**
```typescript
export async function getPageBlocks(pageBlock: BlockObjectResponse) {
  const childrenBlocksResp = await notion.blocks.children.list({
    block_id: pageBlock.id
  })

  const children = []

  for (const block of childrenBlocksResp.results) {
    if (isFullBlock(block)) {
      // Recursively get children blocks
      if (block.has_children) {
        await getPageBlocks(block)
      }

      const type = block.type
      const text_items = block[type].rich_text

      if (!text_items) continue

      if (block.type === 'to_do') {
        const parent_type = block.parent.type
        const parent_id = block.parent[parent_type]

        const full_line = text_items
          .map((text_item) => text_item.plain_text)
          .join(' ')

        children.push({
          notion_block: block,
          block_text: full_line,
          notion_block_id: block.id,
          notion_page_id: pageBlock.id,
          notion_parent_id: parent_id,
          notion_parent_type: parent_type,
          checked: block.to_do.checked
        })
      }
    }
  }

  await supabase.from('todo').insert(children)
}
```

**updateChecked(checked)** - Updates checkbox state
- Updates local checked field
- Syncs to Notion via API
- Returns updated todo

**getText()** - Extracts plain text
- Parses rich_text array from JSONB
- Joins multiple text items
- Returns concatenated string

#### Business Rules

1. **Unique Block IDs:** UNIQUE constraint on notion_block_id
2. **Indexed by Page:** notion_page_id indexed for queries
3. **Indexed by State:** checked indexed for filtering
4. **Recursive Extraction:** Nested todos extracted via recursion
5. **Immutable Content:** Todo text not updated, only checked state

---

### 4. TodosStore (Pinia State Management)

#### Purpose
Manages todo list state on the client-side, including filtering and selection.

#### Location
`stores/todos.ts`

#### State

```typescript
interface TodosState {
  lists: TodoList[]                    // All user's todo lists
  todos: Map<string, Todo[]>           // Todos by list ID
  currentListId: string | null         // Active list
  filter: TodoFilter                   // Active filters
  isLoading: boolean                   // Loading state
  isSyncing: boolean                   // Sync in progress
  error: string | null                 // Error message
  lastSyncAt: Map<string, Date>        // Last sync time per list
}

interface TodoFilter {
  databaseId?: string
  tags?: string[]
  priority?: string
  checked?: boolean
  searchQuery?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority'
  sortOrder?: 'asc' | 'desc'
}
```

#### Getters

**currentList** - Returns active TodoList
**currentTodos** - Returns todos for current list
**filteredTodos** - Applies filters to current todos
**completedCount** - Count of checked todos
**totalCount** - Total todos in current list
**allTags** - Unique tags from todos
**needsSync** - Whether refresh needed (>5 min since last sync)

#### Actions

**fetchLists()** - Load all user's todo lists
```typescript
async fetchLists() {
  this.isLoading = true
  const response = await $fetch('/api/todo-list', { method: 'GET' })
  this.setLists(response.data.todo_lists)
  this.isLoading = false
}
```

**fetchTodos(listId, force)** - Load todos for specific list
```typescript
async fetchTodos(listId: string, force = false) {
  // Skip if we have recent data and not forcing
  if (!force && !this.needsSync && this.todos.has(listId)) {
    return
  }

  this.isLoading = true
  const response = await $fetch(`/api/todo-list/${listId}`)
  this.setTodos(listId, response.data.todos)
  this.lastSyncAt.set(listId, new Date())
  this.isLoading = false
}
```

**updateTodo(todoId, updates)** - Optimistic UI update
**setFilter(filter)** - Apply filters
**clearFilter()** - Reset all filters
**deleteList(listId)** - Remove todo list

---

## Component Interactions

### Todo List Creation Flow

```
User selects Notion database
  ↓
POST /api/todo-list { notion_database_id }
  ↓
Server: Get user tier and limits
  ↓
Check: Can user create more lists?
  ├─ NO → Return 403 with upgrade message
  ↓
  └─ YES → Continue
  ↓
Initialize Notion client with user's token
  ↓
Query Notion database for pages (up to tier limit)
  ↓
For each page (with pagination):
  - Store page in `page` table
  - Call getPageBlocks(page) recursively
  - Extract all 'to_do' blocks
  - Store todos in `todo` table
  ↓
Aggregate extraction metadata:
  - totalPages, totalCheckboxes
  - pagesWithTodos, errors
  - tierLimits applied
  ↓
Create todo_list record with metadata
  ↓
Return { todo_list, extraction_metadata }
  ↓
Client: TodosStore.lists.push(newList)
  ↓
Navigate to /todo-list/[id]
```

### Todo Extraction Flow (Recursive)

```
fetchAllDatabasePages(databaseId, limits)
  ↓
Notion API: databases.query({ database_id })
  ↓
Returns pages (respects maxPages limit)
  ↓
For each page:
  ┌─────────────────────────────┐
  │ getPageBlocks(page.id)      │
  │   ↓                         │
  │ Notion API: blocks.children │
  │   .list({ block_id })       │
  │   ↓                         │
  │ For each block:             │
  │   - If type === 'to_do':    │
  │     * Extract text          │
  │     * Extract checked state │
  │     * Store in todos[]      │
  │   - If has_children:        │
  │     * Recursively call       │
  │       getPageBlocks(block)  │
  │     * Merge results          │
  └─────────────────────────────┘
  ↓
Batch insert all pages into `page` table
  ↓
Batch insert all todos into `todo` table
  ↓
Return extraction summary
```

### Todo List Display Flow

```
Navigate to /todo-list/[id]
  ↓
Component mounted
  ↓
TodosStore.fetchTodos(listId)
  ↓
GET /api/todo-list/[id]
  ↓
Server: Query pages and todos
  ↓
SQL:
SELECT
  p.page_id, p.block_text as page_title,
  t.todo_id, t.block_text, t.checked, t.notion_block_id
FROM page p
LEFT JOIN todo t ON p.notion_block_id = t.notion_page_id
WHERE p.notion_parent_id = :database_id
ORDER BY p.notion_created_time DESC
  ↓
Group todos by page
  ↓
Return { pages: [ { page, todos: [...] } ] }
  ↓
TodosStore updates state
  ↓
Component renders:
  - Page sections (collapsible)
  - Todos under each page
  - Checkbox components
```

### Filtering Flow

```
User types in search box or selects filter
  ↓
TodosStore.setFilter({ searchQuery, checked, tags })
  ↓
Computed: filteredTodos getter recomputes
  ↓
Apply filters in order:
  1. Filter by checked state
  2. Filter by tags (if any match)
  3. Filter by priority
  4. Filter by search query:
     - Match todo text
     - Match page title
     - Match tags
  5. Sort by sortBy field
  ↓
Return filtered array
  ↓
UI reactively updates with results
```

---

## Data Model (PostgreSQL)

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

## Tier Limit Enforcement

### Limits by Tier

```typescript
const TIER_LIMITS = {
  free: {
    maxPages: 25,
    maxCheckboxesPerPage: 25,
    maxTodoLists: 2
  },
  pro: {
    maxPages: 100,
    maxCheckboxesPerPage: 100,
    maxTodoLists: 10
  },
  max: {
    maxPages: 500,
    maxCheckboxesPerPage: 1000,
    maxTodoLists: 25
  }
}
```

### Enforcement Points

1. **List Creation** - Checked in `/api/todo-list/index.post.ts`:
   ```typescript
   if (count >= limits.maxTodoLists) {
     throw createError({
       statusCode: 403,
       message: `You've reached the maximum...`
     })
   }
   ```

2. **Page Extraction** - Enforced in pagination utility:
   ```typescript
   const maxPages = options.maxPages || 100
   // Stop pagination when limit reached
   ```

3. **Checkbox Extraction** - Enforced per page:
   ```typescript
   const maxCheckboxes = limits.maxCheckboxesPerPage
   // Truncate if exceeded
   ```

---

## API Endpoints

### POST /api/todo-list
**Description:** Create new todo list from Notion database

**Request:**
```json
{
  "id": "notion-database-uuid",
  "name": "My Tasks"
}
```

**Response:**
```json
{
  "todo_list": {
    "todo_list_id": "123",
    "notion_database_id": "uuid",
    "extraction_metadata": {
      "totalPages": 15,
      "totalCheckboxes": 45,
      "pagesWithTodos": 12
    }
  }
}
```

### GET /api/todo-list
**Description:** Get all user's todo lists

**Response:**
```json
{
  "data": {
    "todo_lists": [
      {
        "todo_list_id": "123",
        "notion_database_id": "uuid",
        "created_at": "2024-01-15T12:00:00Z"
      }
    ]
  }
}
```

### GET /api/todo-list/[id]
**Description:** Get specific todo list with all todos

**Response:**
```json
{
  "data": {
    "pages": [
      {
        "page_id": "1",
        "block_text": "Project Alpha",
        "todos": [
          {
            "todo_id": "10",
            "block_text": "Complete design",
            "checked": false,
            "notion_block_id": "block-uuid"
          }
        ]
      }
    ]
  }
}
```

### DELETE /api/todo-list/[id]
**Description:** Delete todo list

**Response:**
```json
{
  "success": true
}
```

---

## Validation & Business Rules

### Pre-Creation Validation

1. **Tier Limits:** Check before list creation
2. **Database Access:** Verify user has Notion token
3. **Database Exists:** Notion API validates database ID

### Extraction Rules

1. **Recursive Depth:** No depth limit (follows all nested blocks)
2. **Block Types:** Only 'to_do' blocks extracted
3. **Text Extraction:** Joins all rich_text segments
4. **Page Limits:** Enforced by tier
5. **Checkbox Limits:** Per-page limit enforced

### Error Handling

**Tier Limit Exceeded:**
```typescript
throw createError({
  statusCode: 403,
  message: `You've reached the maximum number of todo lists (${limits.maxTodoLists}) for your ${tier} plan. Upgrade to create more.`,
  data: { tierLimit: true, currentTier: tier }
})
```

**Database Not Found:**
```typescript
throw createError({
  statusCode: 404,
  message: 'Database not found or you don\'t have access'
})
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('TodoList Entity', () => {
  test('should create list with valid database', async () => {
    const list = await TodoList.create(userId, databaseId)
    expect(list.todoListId).toBeDefined()
  })

  test('should enforce tier limits', async () => {
    // Create max lists for free tier
    await Promise.all([
      TodoList.create(userId, db1),
      TodoList.create(userId, db2)
    ])

    // Third should fail
    await expect(TodoList.create(userId, db3))
      .rejects.toThrow('reached the maximum')
  })
})

describe('Todo Extraction', () => {
  test('should extract todos recursively', async () => {
    const todos = await extractTodosFromDatabase(dbId, token, limits)
    expect(todos.length).toBeGreaterThan(0)
    expect(todos[0]).toHaveProperty('block_text')
    expect(todos[0]).toHaveProperty('checked')
  })

  test('should respect page limits', async () => {
    const limits = { maxPages: 5 }
    const result = await extractTodosFromDatabase(dbId, token, limits)
    expect(result.metadata.totalPages).toBeLessThanOrEqual(5)
  })
})
```

### Integration Tests

```typescript
describe('Todo List API (E2E)', () => {
  test('complete list creation flow', async () => {
    // 1. Create list
    const response = await $fetch('/api/todo-list', {
      method: 'POST',
      body: { id: testDatabaseId, name: 'Test' }
    })

    expect(response.todo_list).toBeDefined()

    // 2. Fetch list with todos
    const listData = await $fetch(`/api/todo-list/${response.todo_list.todo_list_id}`)
    expect(listData.data.pages).toBeInstanceOf(Array)

    // 3. Delete list
    await $fetch(`/api/todo-list/${response.todo_list.todo_list_id}`, {
      method: 'DELETE'
    })
  })
})
```

---

## Performance Considerations

### Extraction Performance

1. **Pagination:** Processes pages in batches of 100
2. **Concurrent Requests:** Up to 15 simultaneous API calls
3. **Rate Limiting:** 50ms delay between requests
4. **Batch Inserts:** All pages/todos inserted in single queries

### Query Optimization

1. **Indexed Lookups:** All foreign keys and block IDs indexed
2. **JOIN Optimization:** LEFT JOIN used for page-todo relationship
3. **Result Limiting:** Pagination implemented for large lists
4. **Caching Strategy:** Supabase acts as cache for Notion data

---

## Related Documentation

- **User Stories:** `planning/units/U3_todo_management.md`
- **API Reference:** `.claude/technical/api-reference.md`
- **Database Schema:** `.claude/technical/database-schema.md`
- **Pagination Utilities:** `server/utils/notion-pagination.ts`
