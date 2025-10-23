# Domain Model: U4 - Checkbox Synchronization

## Overview
Bidirectional sync of checkbox states between Checkify and Notion for real-time task management.

**Related User Stories:** See `planning/units/U4_checkbox_synchronization.md`

---

## Architecture: Real-Time Sync (No Caching)

**Data Flow:** Checkify UI ↔ Notion API (Direct)
- No checkbox state cached in Supabase
- All updates go directly to Notion
- Real-time fetching on page load

---

## Domain Components

### 1. Checkbox Update Service (API Endpoint)

**Location:** `server/api/toggle-checkbox.post.ts`

**Purpose:** Updates checkbox state in Notion

**Implementation:**
```typescript
export default defineEventHandler(async (event) => {
  const body: ToDoBlockObjectResponse = await readBody(event)
  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  const response = await notion.blocks.update({
    block_id: body.id,
    to_do: {
      checked: body.to_do.checked
    }
  })

  return response
})
```

**Business Rules:**
1. Updates Notion block directly
2. No local state storage
3. Returns updated block from Notion
4. Uses environment API key (not user's OAuth token)

---

### 2. Set Checkbox Service (Alternative Endpoint)

**Location:** `server/api/set-checkbox.post.ts`

**Purpose:** Alternative checkbox update endpoint

**Request:**
```json
{
  "block_id": "notion-block-uuid",
  "checked": true
}
```

**Response:**
```json
{
  "success": true,
  "block": { ... }
}
```

---

### 3. TodosStore Sync Actions

**Location:** `stores/todos.ts`

**syncToNotion(todoId, checked)** - Lines 258-285
```typescript
async syncToNotion(todoId: string, checked: boolean) {
  if (!this.currentListId) return

  this.isSyncing = true

  // Optimistic update
  this.updateTodo(todoId, { checked })

  try {
    await $fetch('/api/todo-list/sync-to-notion', {
      method: 'POST',
      body: { listId: this.currentListId, todoId, checked }
    })
  } catch (error) {
    // Revert on error
    this.updateTodo(todoId, { checked: !checked })
    this.error = error.data?.message || 'Failed to sync'
    throw error
  } finally {
    this.isSyncing = false
  }
}
```

**Key Features:**
- Optimistic UI update
- Error reversion
- Loading state management

---

## Component Interactions

### Checkbox Toggle Flow

```
User clicks checkbox in UI
  ↓
TodoCheckbox component emits @change
  ↓
TodosStore.syncToNotion(todoId, newState)
  ↓
Store: Optimistic update (immediate UI change)
  ↓
POST /api/toggle-checkbox
  {
    id: "block-uuid",
    to_do: { checked: true }
  }
  ↓
Server: Initialize Notion client
  ↓
notion.blocks.update({ block_id, to_do: { checked } })
  ↓
Success:
  - Return updated block
  - UI stays updated ✓
  ↓
Failure:
  - Store reverts checkbox state
  - Show error toast
  - User can retry
```

---

## Error Handling

### Sync Failures

**Common Errors:**
1. **Invalid Token** (401) - Notion auth expired
2. **Block Not Found** (404) - Block was deleted in Notion
3. **Rate Limited** (429) - Too many requests
4. **Network Error** - Connection timeout

**Error Recovery:**
```typescript
catch (error) {
  // Revert optimistic update
  this.updateTodo(todoId, { checked: !checked })

  // Show user-friendly error
  this.error = error.data?.message || 'Failed to sync with Notion'

  // Allow retry
  throw error
}
```

---

## API Endpoints

### POST /api/toggle-checkbox

**Request:**
```json
{
  "id": "block-uuid-123",
  "to_do": {
    "checked": true
  }
}
```

**Response:**
```json
{
  "object": "block",
  "id": "block-uuid-123",
  "type": "to_do",
  "to_do": {
    "rich_text": [...],
    "checked": true
  }
}
```

### POST /api/set-checkbox

**Request:**
```json
{
  "block_id": "block-uuid-123",
  "checked": false
}
```

**Response:**
```json
{
  "success": true,
  "block": { ... }
}
```

---

## Business Rules

1. **Real-Time Sync:** All changes go directly to Notion
2. **No Caching:** Checkbox states not stored locally
3. **Optimistic Updates:** UI updates before API response
4. **Error Reversion:** Failed syncs revert UI state
5. **Retry Capability:** Users can manually retry failed syncs

---

## Performance Considerations

**Optimistic Updates:**
- Immediate UI feedback
- No waiting for API response
- Better user experience

**No Batching:**
- Each checkbox update is separate API call
- No debouncing implemented
- Rapid toggles may hit rate limits

---

## Testing Strategy

**Test Cases:**
1. Successful checkbox toggle
2. Failed sync with reversion
3. Multiple rapid toggles
4. Network timeout handling
5. Invalid token handling

---

## Related Documentation
- User Stories: `planning/units/U4_checkbox_synchronization.md`
- API Reference: `.claude/technical/api-reference.md`
