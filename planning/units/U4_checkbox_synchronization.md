# Unit 4: Checkbox Synchronization

## Epic Overview
Enable bidirectional sync of checkbox states between Checkify and Notion for real-time task management.

**Status:** 🟢 Completed
**Priority:** High
**Dependencies:** U3 (Todo Management)

---

## User Stories

### U4-S1: Check Off Todo in Checkify
**As a** user
**I want to** check off a todo in Checkify
**So that** it updates in my Notion workspace

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click checkbox in Checkify UI
- [ ] Checkbox state updates immediately (optimistic update)
- [ ] API call syncs state to Notion
- [ ] Notion checkbox updates within seconds
- [ ] Error notification if sync fails
- [ ] State reverts if Notion update fails

**Technical Implementation:**
- `/api/toggle-checkbox` POST endpoint
- Optimistic UI update via Pinia store
- Notion API `blocks.update()` called
- Error handling reverts state

---

### U4-S2: Immediate Checkbox Sync
**As a** user
**I want** checkbox changes to sync immediately
**So that** I see instant feedback

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] UI updates before API call completes (optimistic)
- [ ] Sync request sent immediately on click
- [ ] Visual indicator shows syncing status
- [ ] Success confirmation (subtle animation)
- [ ] Failure notification with retry option

**Technical Implementation:**
- Optimistic update in TodosStore
- Async API call to Notion
- UI feedback via loading states

---

### U4-S3: Optimistic UI Updates
**As a** user
**I want** optimistic UI updates
**So that** the interface feels responsive

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Checkbox state updates immediately on click
- [ ] No waiting for API response
- [ ] State reverts if API call fails
- [ ] User can continue interacting during sync
- [ ] Multiple checkboxes can be toggled quickly

**Technical Implementation:**
- Pinia store `updateTodo()` updates local state
- API call happens asynchronously
- Error handler reverts state on failure

---

### U4-S4: Failed Sync Handling
**As a** user
**I want** failed syncs to revert and notify me
**So that** I know when changes didn't save

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Failed sync reverts checkbox to previous state
- [ ] Error toast notification displayed
- [ ] Retry button available
- [ ] Error message explains what went wrong
- [ ] Multiple failures don't cascade

**Technical Implementation:**
- Catch block in sync function
- `updateTodo()` called with previous state
- Toast notification via notification store
- User can manually retry sync

---

### U4-S5: Manual Refresh
**As a** user
**I want to** manually refresh my todo list
**So that** I can pull the latest changes from Notion

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Refresh button visible in UI
- [ ] Click triggers full re-fetch from Notion
- [ ] Loading indicator shown during refresh
- [ ] All todos updated with latest Notion state
- [ ] Success message after refresh completes

**Technical Implementation:**
- `fetchTodos(listId, force: true)` in TodosStore
- Re-queries Notion API for all pages and blocks
- Updates database cache
- Refreshes UI

---

### U4-S6: Last Sync Time Display
**As a** user
**I want to** see the last sync time
**So that** I know how current my data is

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Last sync timestamp displayed
- [ ] Format: "Last synced X minutes ago"
- [ ] Updates automatically as time passes
- [ ] Shows "Never" if never synced
- [ ] Visible but non-intrusive

**Technical Implementation:**
- `lastSyncAt` Map in TodosStore
- Updated on successful fetch
- Computed property formats relative time
- Auto-updates with reactive timestamp

---

## Technical Architecture

### Components

#### 1. CheckboxSyncService
**Attributes:**
- `notion` (Client): Notion API client
- `supabase` (SupabaseClient): Database client

**Behaviors:**
- `syncCheckboxState()`: Update checkbox in Notion
- `validateBlockId()`: Ensure block ID is valid
- `handleSyncError()`: Error handling and logging
- `updateLocalState()`: Update database cache

**Business Rules:**
- All syncs go through this service
- Implements retry logic
- Logs all sync operations
- Validates token before sync

#### 2. TodoCheckbox Component
**Attributes:**
- `todo` (Todo): Todo item data
- `isLoading` (boolean): Syncing state
- `error` (string | null): Error message

**Behaviors:**
- `handleClick()`: Trigger checkbox toggle
- `optimisticUpdate()`: Update UI immediately
- `revertState()`: Rollback on error
- `showFeedback()`: Display sync status

**Events:**
- `@toggle`: Emitted when checkbox clicked
- `@sync-success`: Emitted when sync completes
- `@sync-error`: Emitted when sync fails

---

## Component Interactions

### Checkbox Toggle Flow
```
User clicks checkbox
  ↓
TodoCheckbox emits @toggle event
  ↓
TodosStore.updateTodo() - optimistic update
  ↓
UI updates immediately (checked state changes)
  ↓
POST /api/toggle-checkbox { block_id, checked }
  ↓
Server retrieves user's Notion token
  ↓
notion.blocks.update({
  block_id,
  to_do: { checked }
})
  ↓
Notion API updates block
  ↓
Update todo table in Supabase
  ↓
Success? → Show subtle confirmation
  ↓
Failure? → Revert state, show error toast
```

### Manual Refresh Flow
```
User clicks "Refresh" button
  ↓
TodosStore.fetchTodos(listId, force: true)
  ↓
isLoading = true
  ↓
Re-query Notion API for all pages
  ↓
For each page: fetch latest blocks
  ↓
Compare with database cache
  ↓
Update changed todos
  ↓
Insert new todos
  ↓
Delete removed todos
  ↓
Update lastSyncAt timestamp
  ↓
isLoading = false
  ↓
Show "Synced successfully" message
```

### Sync Error Handling
```
API call to Notion fails
  ↓
Catch error in sync function
  ↓
Determine error type:
  - Invalid token → Prompt reconnect
  - Block not found → Show error
  - Rate limit → Retry with backoff
  - Network error → Retry option
  ↓
Revert optimistic update
  ↓
Display user-friendly error message
  ↓
Offer retry button
  ↓
Log error for debugging
```

---

## Database Updates

### Update Todo State
```sql
-- After successful Notion sync
UPDATE todo
SET checked = $1, updated_at = NOW()
WHERE notion_block_id = $2
RETURNING *;
```

### Track Sync Operations (Future)
```sql
-- Potential audit table for sync history
CREATE TABLE sync_operations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    todo_id BIGINT NOT NULL REFERENCES todo(todo_id),
    operation VARCHAR NOT NULL, -- 'toggle', 'create', 'delete'
    success BOOLEAN NOT NULL,
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## API Endpoints

### POST /api/toggle-checkbox
**Description:** Toggle checkbox state and sync to Notion

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
    "checked": true,
    "color": "default"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid Notion token. Please reconnect your workspace."
  }
}
```

---

### POST /api/set-checkbox
**Description:** Set checkbox to specific state (alternative endpoint)

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

## Error Scenarios

### 1. Invalid Notion Token
**Error:** `unauthorized` (401)
**User Action:** Reconnect Notion workspace
**Recovery:** Initiate OAuth flow to get new token

### 2. Block Not Found
**Error:** `object_not_found` (404)
**User Action:** Refresh todo list
**Recovery:** Re-sync from Notion to update cache

### 3. Rate Limit Exceeded
**Error:** `rate_limited` (429)
**User Action:** Wait and retry
**Recovery:** Implement exponential backoff

### 4. Network Error
**Error:** Network timeout
**User Action:** Check connection and retry
**Recovery:** Show retry button

---

## Testing Scenarios

### Test Case 1: Successful Toggle
1. Open todo list with unchecked todo
2. Click checkbox
3. Verify immediate UI update (checked)
4. Wait for sync to complete
5. Verify success indicator
6. Check Notion - verify checkbox checked

### Test Case 2: Failed Sync with Revert
1. Simulate network error
2. Click checkbox
3. Verify immediate UI update
4. Wait for sync to fail
5. Verify error message displayed
6. Verify checkbox reverted to original state

### Test Case 3: Multiple Rapid Toggles
1. Click checkbox on/off multiple times quickly
2. Verify each toggle queues correctly
3. Verify final state matches Notion
4. Verify no race conditions

### Test Case 4: Manual Refresh
1. Check off todo in Notion directly
2. Click "Refresh" in Checkify
3. Verify loading indicator
4. Verify todo state updates to match Notion
5. Verify last sync time updates

### Test Case 5: Invalid Token Handling
1. Invalidate Notion token
2. Try to toggle checkbox
3. Verify error message about reconnecting
4. Verify "Reconnect Notion" button shown
5. Complete reconnection
6. Retry toggle successfully

---

## Performance Considerations

### Optimizations
1. **Debouncing**: Prevent rapid toggle spam
2. **Batching**: Group multiple updates (future)
3. **Caching**: Use local cache before API calls
4. **Compression**: Minimize payload sizes

### Sync Strategy
- Optimistic updates: Instant UI feedback
- Background sync: API calls don't block UI
- Retry logic: Handle transient failures
- Conflict resolution: Last write wins

---

## Related Documentation
- [API Reference](.claude/technical/api-reference.md)
- [Architecture Overview](.claude/technical/architecture.md)
- [Notion Integration](.claude/features/notion-integration.md)
