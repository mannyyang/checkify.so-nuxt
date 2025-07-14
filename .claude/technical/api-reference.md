# API Reference

Complete documentation of all API endpoints in Checkify.so, including request/response formats, authentication requirements, and error handling.

## Overview

All API endpoints are located in `/server/api/` and follow these conventions:
- RESTful design principles
- JSON request/response bodies
- Authentication via Supabase middleware
- Consistent error handling

## Authentication

All endpoints except public routes require authentication. The auth middleware automatically:
- Validates Supabase session
- Attaches `user` to request context
- Fetches Notion access token if available

```typescript
// Available in all API routes
event.context.user // Authenticated user
event.context.notionAccessToken // Notion API token
```

## Endpoints

### Auth & User Management

#### `GET /api/auth-notion`
Check if user has connected Notion account.

**Response:**
```json
{
  "is_auth": true
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated

---

### Notion Integration

#### `POST /api/connect-notion`
OAuth callback endpoint for Notion integration.

**Query Parameters:**
- `code` (string, required) - OAuth authorization code
- `state` (string, optional) - OAuth state parameter

**Response:**
```html
<!-- Redirects to success page -->
<script>window.location.href = '/my-todo-lists?notion=connected'</script>
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid code
- `500 Internal Server Error` - Token exchange failed

---

#### `GET /api/search-notion`
Search for Notion databases accessible to the user.

**Response:**
```json
{
  "databases": [
    {
      "id": "database-uuid",
      "title": "My Tasks",
      "icon": "📝",
      "created_time": "2024-01-01T00:00:00.000Z",
      "last_edited_time": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - Notion not connected

---

### Todo List Management

#### `POST /api/todo-list`
Create a new todo list linked to a Notion database.

**Request Body:**
```json
{
  "database_id": "notion-database-uuid"
}
```

**Response:**
```json
{
  "todo_list_id": 123,
  "notion_database_id": "notion-database-uuid",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid database_id
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Database not found

---

#### `GET /api/todo-list`
Get all todo lists for the authenticated user.

**Response:**
```json
[
  {
    "todo_list_id": 123,
    "notion_database_id": "database-uuid",
    "created_at": "2024-01-01T00:00:00.000Z",
    "notion_database": {
      "name": "My Tasks",
      "metadata": {}
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated

---

#### `GET /api/todo-list/[id]`
Get a specific todo list with all pages and todos.

**URL Parameters:**
- `id` (number, required) - Todo list ID

**Response:**
```json
{
  "todo_list_id": 123,
  "pages": [
    {
      "page_id": 456,
      "block_text": "Project Alpha",
      "notion_block_id": "page-uuid",
      "todos": [
        {
          "todo_id": 789,
          "block_text": "Complete design",
          "checked": false,
          "notion_block_id": "block-uuid"
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Todo list not found

---

#### `DELETE /api/todo-list/[id]`
Delete a todo list and unlink from Notion.

**URL Parameters:**
- `id` (number, required) - Todo list ID

**Response:**
```json
{
  "success": true,
  "deleted_id": 123
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Todo list not found
- `403 Forbidden` - User doesn't own this list

---

### Page & Todo Operations

#### `POST /api/page`
Fetch and sync pages from a Notion database.

**Request Body:**
```json
{
  "database_id": "notion-database-uuid",
  "limit": 60
}
```

**Response:**
```json
{
  "synced_pages": 25,
  "synced_todos": 150,
  "has_more": false
}
```

**Error Responses:**
- `400 Bad Request` - Invalid database_id
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - No access to database

---

#### `POST /api/toggle-checkbox`
Toggle a todo checkbox state in Notion.

**Request Body:**
```json
{
  "block_id": "notion-block-uuid",
  "checked": false
}
```

**Response:**
```json
{
  "success": true,
  "checked": true,
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid block_id
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Block not found
- `403 Forbidden` - No permission to update

---

#### `POST /api/todo-list/sync-to-notion`
Sync aggregated todos to a Notion database.

**Request Body:**
```json
{
  "todo_list_id": "uuid",
  "parent_page_id": "notion-page-id (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "syncDatabaseId": "notion-database-id",
  "syncResults": {
    "created": 10,
    "updated": 5,
    "errors": []
  },
  "totalCheckboxes": 15
}
```

**Error Responses:**
- `400 Bad Request` - Invalid todo_list_id
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Todo list not found
- `500 Internal Error` - Notion API error

---

#### `POST /api/notion-webhook`
Handle Notion webhook events for bidirectional sync.

**Headers:**
- `x-notion-signature` - Webhook signature for validation

**Request Body:**
```json
{
  "type": "page.updated",
  "page": {
    "id": "page-id",
    "properties": {
      "Status": {
        "checkbox": true
      },
      "Block ID": {
        "rich_text": [{"plain_text": "block-id"}]
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid webhook payload
- `401 Unauthorized` - Invalid signature
- `404 Not Found` - Page not tracked

---

### Public Endpoints

#### `GET /api/products`
Get demo product data (hardcoded).

**Response:**
```json
[
  {
    "id": 1000,
    "code": "f230fh0g3",
    "name": "Bamboo Watch",
    "description": "Product Description",
    "image": "bamboo-watch.jpg",
    "price": 65,
    "category": "Accessories",
    "quantity": 24,
    "inventoryStatus": "INSTOCK",
    "rating": 5
  }
]
```

**Note:** This endpoint returns demo data and doesn't interact with the database.

---

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "statusMessage": "Human-readable error message",
  "data": {
    "details": "Additional error context"
  }
}
```

### Common Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not allowed)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Handling Example

```typescript
export default defineEventHandler(async (event) => {
  try {
    // Your logic here
  } catch (error) {
    // Notion API errors
    if (error.code === 'object_not_found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Database not found in Notion'
      })
    }
    
    // Generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred'
    })
  }
})
```

## Rate Limiting

### Notion API Limits
- 3 requests per second
- Implement client-side throttling
- Server-side queue for bulk operations

### Supabase Limits
- Depends on your plan
- Monitor usage in dashboard
- Implement caching where possible

## Best Practices

### 1. Input Validation

Always validate request data:

```typescript
const { database_id } = await readBody(event)

if (!database_id || typeof database_id !== 'string') {
  throw createError({
    statusCode: 400,
    statusMessage: 'Invalid database_id'
  })
}
```

### 2. Error Handling

Provide meaningful error messages:

```typescript
try {
  await notion.databases.retrieve({ database_id })
} catch (error) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Database not found or you don\'t have access'
  })
}
```

### 3. Performance

- Use pagination for large datasets
- Implement caching strategies
- Batch operations when possible

### 4. Security

- Never expose sensitive data in responses
- Validate user permissions
- Use parameterized queries

## Testing APIs

### Using cURL

```bash
# Get todo lists
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://checkify.so/api/todo-list

# Toggle checkbox
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"block_id":"block-uuid","checked":false}' \
  https://checkify.so/api/toggle-checkbox
```

### Using Fetch

```javascript
// Get auth status
const response = await fetch('/api/auth-notion', {
  credentials: 'include'
})
const data = await response.json()

// Create todo list
const response = await fetch('/api/todo-list', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    database_id: 'database-uuid'
  }),
  credentials: 'include'
})
```

## API Versioning

Currently, all APIs are unversioned. Future versions will follow:
- `/api/v1/` - Current version
- `/api/v2/` - Future version with breaking changes

## Webhooks

Currently not implemented. Future considerations:
- Notion webhook support
- Real-time updates
- Event-driven architecture