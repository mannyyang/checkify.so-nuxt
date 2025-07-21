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

**Query Parameters:**
- `tier` (string, optional) - Test different subscription tiers (`free`, `pro`, `enterprise`)

**Response:**
```json
{
  "pages": [
    {
      "page": {
        "id": "page-uuid",
        "properties": {
          "Name": {
            "title": [{"plain_text": "Project Alpha"}]
          }
        }
      },
      "checkboxes": [
        {
          "id": "block-uuid",
          "type": "to_do",
          "to_do": {
            "rich_text": [{"plain_text": "Complete design"}],
            "checked": false
          }
        }
      ]
    }
  ],
  "syncInfo": {
    "syncDatabaseId": "sync-db-uuid",
    "lastSyncDate": "2024-01-01T00:00:00.000Z"
  },
  "metadata": {
    "totalPages": 15,
    "totalCheckboxes": 127,
    "pagesWithCheckboxes": 12,
    "extractionComplete": false,
    "errors": [],
    "limits": {
      "tier": "free",
      "maxPages": 10,
      "maxCheckboxesPerPage": 50,
      "pagesLimited": true,
      "reachedPageLimit": true
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Todo list not found
- `500 Internal Server Error` - Notion API error

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

### Subscription & Billing

#### `GET /api/subscription`
Get current subscription status for the authenticated user.

**Response:**
```json
{
  "tier": "pro",
  "status": "active",
  "stripe_customer_id": "cus_xxxxx",
  "stripe_subscription_id": "sub_xxxxx",
  "current_period_end": "2024-02-01T00:00:00.000Z",
  "cancel_at_period_end": false
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated

---

#### `POST /api/stripe/create-checkout-session`
Create a Stripe checkout session for new subscriptions.

**Request Body:**
```json
{
  "priceId": "price_xxxxx",
  "successUrl": "/success",
  "cancelUrl": "/pricing"
}
```

**Response:**
```json
{
  "sessionId": "cs_xxxxx",
  "url": "https://checkout.stripe.com/..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid price ID or already subscribed
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Stripe API error

---

#### `POST /api/stripe/create-portal-session`
Create a Stripe billing portal session for subscription management.

**Request Body:**
```json
{
  "returnUrl": "/settings"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

**Error Responses:**
- `400 Bad Request` - No Stripe customer ID found
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Stripe API error

---

#### `POST /api/stripe/update-subscription`
Update subscription to a different tier.

**Request Body:**
```json
{
  "newPriceId": "price_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxxxx",
    "status": "active",
    "items": [{"price": {"id": "price_xxxxx"}}]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid price ID or no active subscription
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Stripe API error

---

#### `POST /api/stripe/cancel-subscription`
Cancel the active subscription at period end.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxxxx",
    "cancel_at_period_end": true,
    "current_period_end": 1234567890
  }
}
```

**Error Responses:**
- `400 Bad Request` - No active subscription found
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Stripe API error

---

#### `POST /api/stripe/reactivate-subscription`
Reactivate a cancelled subscription before period end.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxxxx",
    "cancel_at_period_end": false,
    "status": "active"
  }
}
```

**Error Responses:**
- `400 Bad Request` - No cancelled subscription found
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Stripe API error

---

#### `POST /api/stripe/webhook`
Handle Stripe webhook events.

**Headers:**
- `stripe-signature` - Webhook signature for validation

**Request Body:**
Stripe event object (varies by event type)

**Response:**
```json
{
  "received": true
}
```

**Handled Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

**Error Responses:**
- `400 Bad Request` - Invalid signature or payload
- `500 Internal Server Error` - Processing error

---

#### `POST /api/stripe/sync-customer`
Sync or create Stripe customer for the user.

**Response:**
```json
{
  "customerId": "cus_xxxxx",
  "email": "user@example.com"
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Stripe API error

---

#### `POST /api/stripe/sync-subscription`
Sync subscription status from Stripe to database.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "tier": "pro",
    "status": "active",
    "current_period_end": "2024-02-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Sync error

---

#### `GET /api/stripe/debug-subscription` (Development Only)
Debug endpoint to check subscription state and Stripe configuration.

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "database": {
    "tier": "pro",
    "status": "active",
    "stripe_customer_id": "cus_xxxxx",
    "stripe_subscription_id": "sub_xxxxx"
  },
  "stripe": {
    "customer": {
      "id": "cus_xxxxx",
      "email": "user@example.com",
      "deleted": false
    },
    "subscriptions": [
      {
        "id": "sub_xxxxx",
        "status": "active",
        "priceId": "price_xxxxx",
        "productId": "prod_xxxxx",
        "created": "2024-01-01T00:00:00.000Z",
        "current_period_end": "2024-02-01T00:00:00.000Z"
      }
    ]
  },
  "environment": {
    "STRIPE_PRICE_ID_PRO": "price_xxxxx",
    "STRIPE_PRICE_ID_MAX": "price_xxxxx"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated

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

### Application-Specific Error Codes

**Authentication & Authorization:**
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User authenticated but lacks permission
- `AUTHENTICATION_FAILED` - Auth token invalid or expired

**Validation & Input:**
- `VALIDATION_ERROR` - Request validation failed
- `MISSING_REQUIRED_FIELD` - Required field not provided
- `INVALID_INPUT` - Input format or value invalid
- `INVALID_REQUEST` - General request validation failed

**Resources:**
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists (e.g., duplicate subscription)

**External Services:**
- `NOTION_API_ERROR` - Notion API request failed
- `STRIPE_API_ERROR` - Stripe API request failed
- `SUPABASE_ERROR` - Database operation failed

**Server Errors:**
- `INTERNAL_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

**Limits & Subscriptions:**
- `RATE_LIMIT_EXCEEDED` - API rate limit reached
- `SUBSCRIPTION_REQUIRED` - Feature requires paid subscription
- `TIER_LIMIT_EXCEEDED` - Subscription tier limit reached

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

## Middleware

### `ensure-user-profile`

Automatically creates a user profile and Stripe customer if they don't exist. Applied to all authenticated routes.

```typescript
// Creates user_profiles entry with:
{
  user_id: user.id,
  email: user.email,
  tier: 'free',
  status: 'active',
  stripe_customer_id: 'cus_xxxxx' // Auto-created Stripe customer
}
```

This middleware:
- Checks if user profile exists
- Creates profile if missing
- Creates Stripe customer if missing
- Syncs email with Stripe
- Runs on every authenticated request

**Implementation Details:**

1. **Profile Creation**: If no profile exists, creates one with default 'free' tier
2. **Stripe Integration**: Automatically creates Stripe customer with user's email
3. **Error Handling**: Continues request even if Stripe customer creation fails
4. **Performance**: Uses database upsert to minimize queries
5. **Scope**: Only runs for authenticated API routes (skips public endpoints)

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

### Stripe Webhooks

Stripe webhooks are handled at `/api/stripe/webhook`. Configure your webhook endpoint in the Stripe dashboard with the following events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

**Security:**
- Webhook signature validation using `stripe-signature` header
- Environment variable `STRIPE_WEBHOOK_SECRET` required

### Notion Webhooks

Notion webhooks are handled at `/api/notion-webhook` for bidirectional sync. This enables real-time updates when todos are checked in Notion.

**Security:**
- Signature validation using `x-notion-signature` header
- Only available for Pro and Max tiers