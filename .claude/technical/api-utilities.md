# API Utilities

Documentation for server-side utility functions used across API endpoints.

## Table of Contents

- [Response Utilities](#response-utilities)
- [Stripe Utilities](#stripe-utilities)
- [Notion Pagination Utilities](#notion-pagination-utilities)
- [Database Utilities](#database-utilities)
- [Error Codes](#error-codes)
- [Best Practices](#best-practices)

## Response Utilities

Located in `/server/utils/api-response.ts`, these utilities provide standardized API responses.

### `sendSuccess(event, data, statusCode = 200)`

Send a successful JSON response.

```typescript
return sendSuccess(event, {
  message: 'Operation completed',
  userId: 'user-123'
});
// Returns: { success: true, data: { message: '...', userId: '...' } }
```

### `sendError(event, message, statusCode = 400, errorCode?)`

Send an error response with optional error code.

```typescript
return sendError(event, 'Invalid request', 400, 'INVALID_REQUEST');
// Returns: { success: false, error: 'Invalid request', errorCode: 'INVALID_REQUEST' }
```

### `handleError(event, error)`

Centralized error handling that formats various error types.

```typescript
try {
  // Your logic
} catch (error) {
  return handleError(event, error);
}
```

Handles:
- Custom errors with status codes
- Validation errors
- Stripe errors
- Generic errors

### `requireAuth(event)`

Ensure user is authenticated, throws error if not.

```typescript
const user = await requireAuth(event);
// Returns user object or throws 401 error
```

### `validateBody(event, schema)`

Validate request body against a schema.

```typescript
const schema = z.object({
  name: z.string().min(1),
  age: z.number().positive()
});

const data = await validateBody(event, schema);
// Returns validated data or throws validation error
```

## Stripe Utilities

Located in `/server/utils/stripe.ts`, these utilities handle Stripe operations.

### `getTierFromPriceId(priceId)`

Map Stripe price ID to subscription tier.

```typescript
const tier = getTierFromPriceId('price_xxxxx');
// Returns: 'pro' | 'max' | null
```

### `getOrCreateStripeCustomer(userId, email)`

Get existing or create new Stripe customer.

```typescript
const customerId = await getOrCreateStripeCustomer(
  'user-123',
  'user@example.com'
);
// Returns: 'cus_xxxxx'
```

Creates customer if not exists and updates database.

### `verifyAndSyncStripeCustomer(userId, email)`

Verify Stripe customer exists and sync with database.

```typescript
const customerId = await verifyAndSyncStripeCustomer(
  'user-123',
  'user@example.com'
);
// Returns: 'cus_xxxxx'
```

Handles:
- Customer verification
- Email updates
- Database sync
- Error recovery

## Notion Pagination Utilities

Located in `/server/utils/notion-pagination.ts`, handles efficient pagination of Notion API requests.

### Configuration

```typescript
const PAGINATION_CONFIG = {
  maxPagesPerRequest: 100,      // Notion API limit
  maxBlocksPerRequest: 100,     // Notion API limit  
  maxConcurrentRequests: 5,     // Concurrent request limit
  requestDelayMs: 100,          // Delay between requests
  tierLimits: {
    free: { pages: 10, checkboxesPerPage: 25 },
    pro: { pages: 100, checkboxesPerPage: 200 },
    max: { pages: 500, checkboxesPerPage: 1000 }
  }
};
```

### `fetchAllPagesWithTodos(databaseId, notionClient, tier)`

Fetches all pages from a Notion database with tier-based limits:

```typescript
const result = await fetchAllPagesWithTodos(
  databaseId,
  notionClient,
  userTier
);

// Returns:
{
  pages: Todo[],
  metadata: {
    totalPages: number,
    totalCheckboxes: number,
    pagesWithCheckboxes: number,
    extractionComplete: boolean,
    errors: string[],
    limits: {
      tier: string,
      maxPages: number,
      maxCheckboxesPerPage: number,
      pagesLimited: boolean,
      reachedPageLimit: boolean
    }
  }
}
```

Features:
- Respects subscription tier limits
- Handles Notion API pagination automatically
- Extracts todos from each page
- Provides detailed metadata about the extraction
- Implements rate limiting and error handling

### `extractTodosFromPage(pageId, notionClient, metadata, tierLimits)`

Extracts todo items from a single Notion page:

```typescript
const todos = await extractTodosFromPage(
  pageId,
  notionClient,
  metadata,
  tierLimits
);
```

Features:
- Recursively fetches all blocks in a page
- Filters for checkbox blocks only
- Respects per-page checkbox limits
- Handles nested blocks properly
- Updates metadata during extraction

## Database Utilities

Common patterns for database operations.

### Transaction Pattern

```typescript
const { data, error } = await supabase.rpc('transaction_function', {
  param1: value1,
  param2: value2
});

if (error) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Database operation failed'
  });
}
```

### Upsert Pattern

```typescript
const { error } = await supabase
  .from('user_profiles')
  .upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id'
  });
```

## Error Codes

Standard error codes used across the API:

- `INVALID_REQUEST` - Request validation failed
- `SUBSCRIPTION_REQUIRED` - Feature requires paid subscription
- `TIER_LIMIT_EXCEEDED` - Subscription tier limit reached
- `ALREADY_EXISTS` - Resource already exists
- `NOT_FOUND` - Resource not found
- `AUTHENTICATION_FAILED` - Auth token invalid
- `STRIPE_ERROR` - Stripe API error
- `DATABASE_ERROR` - Database operation failed

## Best Practices

### 1. Always Use Response Utilities

```typescript
// Good
return sendSuccess(event, { userId });

// Avoid
return { success: true, data: { userId } };
```

### 2. Consistent Error Handling

```typescript
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await validateBody(event, schema);
    
    // Your logic here
    
    return sendSuccess(event, result);
  } catch (error) {
    return handleError(event, error);
  }
});
```

### 3. Validate Input Early

```typescript
const schema = z.object({
  priceId: z.string().startsWith('price_'),
  returnUrl: z.string().url()
});

const { priceId, returnUrl } = await validateBody(event, schema);
```

### 4. Use Transactions for Related Operations

```typescript
// When creating related records
const { data: profile } = await supabase
  .from('user_profiles')
  .insert({ ... })
  .select()
  .single();

const { data: subscription } = await supabase
  .from('subscriptions')
  .insert({ 
    profile_id: profile.id,
    ...
  });
```

### 5. Log Important Operations

```typescript
console.log(`[Stripe] Creating customer for user ${userId}`);
const customer = await stripe.customers.create({ ... });
console.log(`[Stripe] Customer created: ${customer.id}`);
```