# Domain Model: U2 - Notion Integration

## Overview
This domain model defines the components, attributes, behaviors, and interactions required to integrate with Notion's API using OAuth 2.0, allowing users to connect their Notion workspaces and access databases.

**Related User Stories:** See `planning/units/U2_notion_integration.md`

---

## Domain Components

### 1. NotionAccessToken (Domain Entity)

#### Purpose
Stores the OAuth response from Notion with individual columns for each field, **not as a single JSONB column**.

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | BigInt | Yes | Generated | Token record identifier (primary key) |
| `botId` | String | Yes | - | Notion bot ID |
| `accessToken` | String | Yes | - | Notion access token (used for UNIQUE constraint) |
| `tokenType` | String | Yes | - | Token type (usually 'bearer') |
| `workspaceName` | String | No | null | Name of connected Notion workspace |
| `workspaceIcon` | String | No | null | Icon URL of workspace |
| `workspaceId` | String | Yes | - | Notion workspace UUID |
| `requestId` | String | No | null | Request ID from OAuth response |
| `owner` | JSONB | No | null | Owner information (user details) |
| `duplicatedTemplateId` | String | No | null | Template ID if duplicated |
| `createdAt` | Timestamp | Yes | NOW() | Token creation time |

#### Owner JSONB Structure
```json
{
  "type": "user",
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "avatar_url": "https://...",
    "type": "person",
    "person": { "email": "john@example.com" }
  }
}
```

#### Behaviors

**store(oauthResponse: NotionOAuthResponse): Promise<NotionAccessToken>**
- Inserts OAuth response with individual fields
- Uses upsert with `onConflict: 'access_token'`
- Returns created token record

**Actual Implementation (server/api/connect-notion.post.ts):**
```typescript
await supabase.from('notion_access_token').upsert({
  bot_id: response.bot_id,
  access_token: response.access_token,
  token_type: response.token_type,
  workspace_name: response.workspace_name,
  workspace_icon: response.workspace_icon,
  workspace_id: response.workspace_id,
  request_id: response.request_id,
  owner: response.owner,
  duplicated_template_id: response.duplicated_template_id
}, {
  onConflict: 'access_token'
})
```

#### Business Rules

1. **Individual Columns:** Each OAuth field stored in separate column (not JSONB)
2. **Upsert Strategy:** Replaces existing token with same `access_token` value
3. **No Expiration:** Notion tokens don't expire unless revoked
4. **Direct Access:** No need for extraction methods - columns accessed directly

---

### 2. NotionAccessTokenUser (Domain Entity)

#### Purpose
Links users to their Notion access tokens, enabling one token per user.

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | BigInt | Yes | Generated | Link identifier (primary key) |
| `userId` | UUID | Yes | - | Foreign key to auth.users (unique) |
| `accessToken` | String | Yes | - | Notion access token value |
| `createdAt` | Timestamp | Yes | NOW() | Link creation time |

#### Behaviors

**link(userId: UUID, token: string): Promise<NotionAccessTokenUser>**
- Creates link between user and token
- Replaces existing token if present (upsert)
- Returns link record

**getToken(userId: UUID): Promise<string | null>**
- Retrieves token for given user
- Returns null if no token found

**removeToken(userId: UUID): Promise<void>**
- Deletes token link for user
- Effectively disconnects Notion

**isConnected(userId: UUID): Promise<boolean>**
- Checks if user has connected token
- Returns true if token exists

#### Business Rules

1. **One Token Per User:** Enforced by UNIQUE constraint on userId
2. **Cascade Delete:** Link deleted when user is deleted
3. **Token Security:** Token never exposed to client-side code
4. **Auto-Replace:** New OAuth replaces old token automatically

---

### 3. NotionDatabase (Domain Entity)

#### Purpose
Caches metadata about Notion databases the user has access to, reducing API calls.

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | BigInt | Yes | Generated | Database record identifier (primary key) |
| `notionDatabaseId` | String | Yes | - | Notion's database UUID (unique) |
| `name` | String | No | null | Database title/name |
| `metadata` | JSONB | No | {} | Complete database object from Notion |
| `accessToken` | String | Yes | - | Token used to access this database |
| `createdAt` | Timestamp | Yes | NOW() | Record creation time |

#### JSONB Structure (metadata)
```json
{
  "id": "database-uuid",
  "object": "database",
  "title": [{ "text": { "content": "My Tasks" } }],
  "icon": { "type": "emoji", "emoji": "📝" },
  "properties": {
    "Name": { "id": "title", "type": "title" },
    "Status": { "id": "status", "type": "select" }
  },
  "created_time": "2024-01-01T00:00:00.000Z",
  "last_edited_time": "2024-01-15T12:00:00.000Z"
}
```

#### Behaviors

**fetchFromNotion(databaseId: string, token: string): Promise<NotionDatabase>**
- Queries Notion API for database
- Parses title from properties
- Stores complete metadata as JSONB
- Returns database record

**updateMetadata(metadata: object): Promise<void>**
- Updates cached metadata
- Used when database changes in Notion

**getTitle(): string**
- Extracts title from metadata JSONB
- Returns plain text title

**getIcon(): { type: string, value: string }**
- Extracts icon from metadata
- Returns emoji or image URL

**getProperties(): DatabaseProperties**
- Parses properties schema
- Returns map of property names to types

#### Business Rules

1. **Unique Database ID:** Each Notion database cached once
2. **Token Association:** Database tied to token used for access
3. **Cache Duration:** No automatic expiration (refreshed on user request)
4. **Metadata Completeness:** Full Notion response stored

---

### 4. Notion API Client (Direct SDK Usage, No Service Class)

#### Purpose
**No dedicated `NotionClient` service class exists.** Notion SDK (`@notionhq/client`) is used directly in API endpoints with utility functions for common operations.

#### Direct SDK Usage

**Initialization in Each Endpoint:**
```typescript
// From server/api/search-notion.ts
import { Client } from '@notionhq/client'

export default defineEventHandler(async (event) => {
  const { notion_auth } = event.context
  const notion = new Client({ auth: notion_auth.access_token })

  // Use client directly
  const response = await notion.search({
    query,
    filter: { value: 'database', property: 'object' }
  })
})
```

#### Utility Functions

**Location:** `server/utils/notion-pagination.ts`

These are **utility functions**, not a service class:

**fetchAllDatabasePages(client, databaseId, options)**
- Handles pagination for database queries
- Respects `maxPagesPerRequest` limit (100)
- Returns all pages up to limit

**fetchAllChildBlocks(client, blockId, options)**
- Recursively fetches all child blocks
- Handles nested block structures
- Returns flat list of blocks

**Configuration:**
```typescript
const EXTRACTION_CONFIG = {
  maxPagesPerRequest: 100,
  maxConcurrentRequests: 15,
  requestDelayMs: 50  // 20 requests/second, NOT 3/second
}
```

#### Common Operations

**Search Databases** (`/server/api/search-notion.ts`):
```typescript
const response = await notion.search({
  query,
  filter: { value: 'database', property: 'object' },
  sort: { direction: 'ascending', timestamp: 'last_edited_time' }
})
```

**Query Database** (via `fetchAllDatabasePages`):
- Used in todo extraction logic
- Handles pagination automatically

**Update Block** (`/server/api/toggle-checkbox.post.ts`):
```typescript
await notion.blocks.update({
  block_id: body.id,
  to_do: { checked: body.to_do.checked }
})
```

**Create Database** (Sync to Notion feature):
- Used in sync-to-notion functionality
- Creates aggregated todo database

#### Business Rules

1. **No Service Class:** SDK used directly in each endpoint
2. **Rate Limiting:** 50ms delay between requests (20 req/s), not 3 req/s
3. **No Retry Logic:** Not implemented
4. **No Token Validation:** Token validity assumed (checked on error)
5. **Utility Functions:** Pagination helpers instead of service methods

---

### 5. Notion OAuth Implementation (No Service Class)

#### Purpose
**No dedicated `NotionOAuthService` class exists.** OAuth logic is distributed across Vue components and API endpoints.

#### OAuth Initiation (Client-Side)

**Location:** `pages/connect-notion.vue`

**⚠️ SECURITY ISSUE:** Client ID is hardcoded in Vue component instead of environment variable:

```typescript
// ISSUE: Hardcoded client ID
const clientId = '2632be3c-842c-4597-b89f-58f60a345ad9'
const redirectUri = encodeURIComponent(
  window.location.origin + '/connect-notion'
)
const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}`
window.location.href = authUrl
```

**⚠️ SECURITY ISSUE:** No state parameter generated (missing CSRF protection):
- OAuth URL does not include `state` parameter
- No state validation in callback

#### OAuth Callback (Server-Side)

**Location:** `server/api/connect-notion.post.ts`

**Code Exchange:**
```typescript
const clientId = process.env.NOTION_OAUTH_CLIENT_ID
const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET
const redirectUri = process.env.BASE_URL + '/connect-notion'

const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

response = await $fetch('https://api.notion.com/v1/oauth/token', {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
    authorization: `Basic ${encoded}`
  },
  body: {
    grant_type: 'authorization_code',
    code: body.code,
    redirect_uri: redirectUri
  }
})
```

**⚠️ NO VALIDATION:** OAuth response is not validated before storage

**Token Storage:**
1. Insert into `notion_access_token` table
2. Link to user in `notion_access_token_user` table
3. No error handling for failed inserts

#### Database Search

**Location:** `server/api/search-notion.ts`

Replaces the documented `refreshDatabases()` method:

```typescript
const notion = new Client({ auth: notion_auth.access_token })
const response = await notion.search({
  query,
  filter: { value: 'database', property: 'object' }
})
```

#### Disconnect Feature

**❌ NOT IMPLEMENTED:** No dedicated `disconnectNotion()` endpoint exists.

Users would need to:
1. Manually revoke in Notion settings
2. Delete todo lists (which cascades to token)

#### Business Rules (Actual)

1. **❌ No CSRF Protection:** State parameter not implemented
2. **✓ Secure Exchange:** Code exchange happens server-side
3. **⚠️ Client Secret Security:** Properly stored in env vars but client ID is hardcoded
4. **✓ Redirect URI:** Matches OAuth app configuration

---

## Component Interactions

### Notion Connection Flow

```
┌──────────────────┐
│  User Browser    │
└────────┬─────────┘
         │
         │ 1. Click "Connect Notion"
         │
         ↓
┌────────────────────────────────┐
│  NotionOAuthService            │
│  initiateOAuthFlow()           │
│  - Generate state              │
│  - Build OAuth URL             │
│  - Store state in session      │
└────────┬───────────────────────┘
         │
         │ 2. Redirect to Notion OAuth
         │    (with client_id, redirect_uri, state)
         │
         ↓
┌──────────────────┐
│  Notion OAuth    │
│  (External)      │
│  - User selects  │
│    databases     │
│  - Grants access │
└────────┬─────────┘
         │
         │ 3. Callback with code & state
         │
         ↓
┌────────────────────────────────┐
│  NotionOAuthService            │
│  handleCallback(code, state)   │
│  - Validate state              │
│  - Exchange code for token     │
└────────┬───────────────────────┘
         │
         │ 4. Store OAuth response
         │
         ↓
┌────────────────────────────────┐
│  NotionAccessToken Entity      │
│  store(oauthResponse)          │
└────────┬───────────────────────┘
         │
         │ 5. Link token to user
         │
         ↓
┌────────────────────────────────┐
│  NotionAccessTokenUser Entity  │
│  link(userId, token)           │
└────────┬───────────────────────┘
         │
         │ 6. Fetch accessible databases
         │
         ↓
┌────────────────────────────────┐
│  NotionClient Service          │
│  searchDatabases()             │
└────────┬───────────────────────┘
         │
         │ 7. Cache database metadata
         │
         ↓
┌────────────────────────────────┐
│  NotionDatabase Entity         │
│  fetchFromNotion() (for each)  │
└────────┬───────────────────────┘
         │
         │ 8. Return to user
         │
         ↓
┌──────────────────┐
│  User Browser    │
│  (redirect to    │
│   database       │
│   selection)     │
└──────────────────┘
```

### Database Search Flow

```
┌──────────────────┐
│  User Browser    │
│  (Database       │
│   Selection Page)│
└────────┬─────────┘
         │
         │ 1. Load databases
         │
         ↓
┌────────────────────────────────┐
│  API: GET /api/search-notion   │
└────────┬───────────────────────┘
         │
         │ 2. Get user's token
         │
         ↓
┌────────────────────────────────┐
│  NotionAccessTokenUser         │
│  getToken(userId)              │
└────────┬───────────────────────┘
         │
         │ 3. Initialize client
         │
         ↓
┌────────────────────────────────┐
│  NotionClient                  │
│  initialize(token)             │
└────────┬───────────────────────┘
         │
         │ 4. Search for databases
         │
         ↓
┌────────────────────────────────┐
│  Notion API                    │
│  notion.search({               │
│    filter: "database"          │
│  })                            │
└────────┬───────────────────────┘
         │
         │ 5. Process results
         │
         ↓
┌────────────────────────────────┐
│  For each database:            │
│  - Check if already cached     │
│  - If not, create record       │
│  - If yes, update metadata     │
└────────┬───────────────────────┘
         │
         │ 6. Query/Insert databases
         │
         ↓
┌────────────────────────────────┐
│  NotionDatabase                │
│  fetchFromNotion() or update() │
└────────┬───────────────────────┘
         │
         │ 7. Return database list
         │
         ↓
┌──────────────────┐
│  User Browser    │
│  (Display list   │
│   with icons)    │
└──────────────────┘
```

### Token Validation Flow

```
┌──────────────────┐
│  API Request     │
│  (Requires       │
│   Notion access) │
└────────┬─────────┘
         │
         │ 1. Retrieve token
         │
         ↓
┌────────────────────────────────┐
│  NotionAccessTokenUser         │
│  getToken(userId)              │
└────────┬───────────────────────┘
         │
         ├─────────────┬──────────────┐
         │             │              │
     Token Found   No Token       Token Invalid
         │             │              │
         ↓             ↓              ↓
  ┌──────────┐  ┌──────────┐  ┌──────────────┐
  │ Validate │  │ Return   │  │ Return 401   │
  │ Token    │  │ 401 with │  │ with         │
  │          │  │ "connect"│  │ "reconnect"  │
  │          │  │ message  │  │ message      │
  └────┬─────┘  └──────────┘  └──────────────┘
       │
       │ 2. Attempt API call
       │
       ↓
┌────────────────────────────────┐
│  NotionClient                  │
│  validateToken()               │
└────────┬───────────────────────┘
         │
         ├─────────────┬──────────────┐
         │             │              │
      Valid        Invalid         Error
         │             │              │
         ↓             ↓              ↓
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Continue │  │ Remove   │  │ Return   │
  │ Request  │  │ Token &  │  │ Error    │
  │          │  │ Return   │  │          │
  │          │  │ 401      │  │          │
  └──────────┘  └──────────┘  └──────────┘
```

---

## Data Model (PostgreSQL)

### notion_access_token

**Actual Schema (Individual Columns):**

```sql
CREATE TABLE notion_access_token (
    id BIGSERIAL PRIMARY KEY,
    bot_id TEXT NOT NULL,
    access_token TEXT NOT NULL UNIQUE,
    token_type TEXT NOT NULL,
    workspace_name TEXT,
    workspace_icon TEXT,
    workspace_id TEXT NOT NULL,
    request_id TEXT,
    owner JSONB,
    duplicated_template_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notion_access_token_created ON notion_access_token(created_at);
CREATE INDEX idx_notion_access_token_workspace ON notion_access_token(workspace_id);
CREATE UNIQUE INDEX idx_notion_access_token_token ON notion_access_token(access_token);
```

**Note:** Schema differs from original documentation which showed a single JSONB column.

### notion_access_token_user

```sql
CREATE TABLE notion_access_token_user (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_user_token UNIQUE(user_id)
);

CREATE INDEX idx_notion_token_user ON notion_access_token_user(user_id);
CREATE INDEX idx_notion_token_value ON notion_access_token_user(access_token);
```

### notion_database

```sql
CREATE TABLE notion_database (
    id BIGSERIAL PRIMARY KEY,
    notion_database_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(500),
    metadata JSONB,
    access_token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_notion_id CHECK (length(notion_database_id) > 0)
);

CREATE INDEX idx_notion_database_id ON notion_database(notion_database_id);
CREATE INDEX idx_notion_database_token ON notion_database(access_token);
CREATE INDEX idx_notion_database_name ON notion_database(name);
```

---

## Row Level Security (RLS) Policies

### notion_access_token_user Table

```sql
ALTER TABLE notion_access_token_user ENABLE ROW LEVEL SECURITY;

-- Users can view their own token
CREATE POLICY "Users can view own token"
    ON notion_access_token_user
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own token
CREATE POLICY "Users can insert own token"
    ON notion_access_token_user
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own token
CREATE POLICY "Users can delete own token"
    ON notion_access_token_user
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access"
    ON notion_access_token_user
    FOR ALL
    USING (auth.role() = 'service_role');
```

---

## Validation Rules

### OAuth Response Validation

```typescript
class NotionOAuthValidator {
  static validateOAuthResponse(response: any): ValidationResult {
    const required = ['access_token', 'token_type', 'bot_id', 'workspace_id'];

    for (const field of required) {
      if (!response[field]) {
        return {
          valid: false,
          error: `Missing required field: ${field}`
        };
      }
    }

    if (response.token_type !== 'bearer') {
      return {
        valid: false,
        error: 'Invalid token type. Expected "bearer"'
      };
    }

    if (!response.access_token.startsWith('secret_')) {
      return {
        valid: false,
        error: 'Invalid access token format'
      };
    }

    return { valid: true };
  }
}
```

### Database Metadata Validation

```typescript
class NotionDatabaseValidator {
  static validateDatabaseId(databaseId: string): ValidationResult {
    // Notion database IDs are 32-character UUIDs without hyphens
    const idRegex = /^[0-9a-f]{32}$/i;

    if (!databaseId) {
      return { valid: false, error: 'Database ID is required' };
    }

    if (!idRegex.test(databaseId.replace(/-/g, ''))) {
      return { valid: false, error: 'Invalid Notion database ID format' };
    }

    return { valid: true };
  }

  static validateDatabaseMetadata(metadata: any): ValidationResult {
    if (!metadata || typeof metadata !== 'object') {
      return { valid: false, error: 'Metadata must be an object' };
    }

    if (!metadata.object || metadata.object !== 'database') {
      return { valid: false, error: 'Invalid Notion database object' };
    }

    if (!metadata.properties || typeof metadata.properties !== 'object') {
      return { valid: false, error: 'Database must have properties' };
    }

    return { valid: true };
  }
}
```

---

## Error Handling

### Notion Integration Errors

| Error Code | HTTP Status | User Message | Resolution |
|------------|-------------|--------------|------------|
| `NOTION_TOKEN_INVALID` | 401 | Notion connection expired | Reconnect your Notion workspace |
| `NOTION_OAUTH_FAILED` | 500 | Failed to connect Notion | Try again or check permissions |
| `NOTION_DATABASE_NOT_FOUND` | 404 | Database not found | Check if you have access in Notion |
| `NOTION_ACCESS_DENIED` | 403 | Access denied to database | Grant access in Notion |
| `NOTION_RATE_LIMITED` | 429 | Too many requests | Wait a moment and try again |
| `NOTION_API_ERROR` | 500 | Notion API error | Try again later |

### Implementation

```typescript
class NotionIntegrationError extends Error {
  constructor(
    public code: string,
    public httpStatus: number,
    public userMessage: string,
    public notionError?: any
  ) {
    super(userMessage);
    this.name = 'NotionIntegrationError';
  }

  static fromNotionError(error: any): NotionIntegrationError {
    const errorMap: Record<string, { code: string, status: number, message: string }> = {
      'unauthorized': {
        code: 'NOTION_TOKEN_INVALID',
        status: 401,
        message: 'Your Notion connection has expired. Please reconnect.'
      },
      'object_not_found': {
        code: 'NOTION_DATABASE_NOT_FOUND',
        status: 404,
        message: 'The requested database was not found. Check your permissions in Notion.'
      },
      'restricted_resource': {
        code: 'NOTION_ACCESS_DENIED',
        status: 403,
        message: 'Access denied to this database. Please grant access in Notion.'
      },
      'rate_limited': {
        code: 'NOTION_RATE_LIMITED',
        status: 429,
        message: 'Too many requests. Please wait a moment and try again.'
      }
    };

    const mapped = errorMap[error.code] || {
      code: 'NOTION_API_ERROR',
      status: 500,
      message: 'An error occurred connecting to Notion. Please try again.'
    };

    return new NotionIntegrationError(
      mapped.code,
      mapped.status,
      mapped.message,
      error
    );
  }
}
```

---

## Security Considerations

### Token Security
1. **Server-Side Only:** Access tokens never sent to client
2. **Encrypted Storage:** Tokens encrypted at rest in database
3. **RLS Protection:** Users can only access their own tokens
4. **No Logging:** Tokens never logged in plaintext

### OAuth Security
1. **State Parameter:** CSRF protection via random state
2. **Redirect URI Validation:** Only whitelisted URIs accepted
3. **Client Secret:** Stored in environment variables only
4. **Code Exchange:** Happens server-side only

### API Security
1. **Rate Limiting:** Respects Notion's 3 req/sec limit
2. **Token Validation:** Validated before each use
3. **Error Sanitization:** Notion errors sanitized before sending to client
4. **Permission Checking:** Database access verified before operations

---

## Testing Strategy

### Unit Tests

```typescript
describe('NotionClient', () => {
  test('should search for databases', async () => {
    const client = new NotionClient('secret_token');
    const databases = await client.searchDatabases();

    expect(databases).toBeInstanceOf(Array);
    expect(databases.length).toBeGreaterThan(0);
  });

  test('should validate token', async () => {
    const client = new NotionClient('secret_valid_token');
    const isValid = await client.validateToken();

    expect(isValid).toBe(true);
  });

  test('should reject invalid token', async () => {
    const client = new NotionClient('invalid_token');
    const isValid = await client.validateToken();

    expect(isValid).toBe(false);
  });
});

describe('NotionOAuthService', () => {
  test('should initiate OAuth flow', async () => {
    const result = await oauthService.initiateOAuthFlow('http://localhost/callback');

    expect(result.url).toContain('api.notion.com/v1/oauth/authorize');
    expect(result.url).toContain('client_id=');
    expect(result.url).toContain('state=');
    expect(result.state).toBeDefined();
  });

  test('should handle OAuth callback', async () => {
    const token = await oauthService.handleCallback('auth_code', 'state_123');

    expect(token.accessToken).toBeDefined();
    expect(token.accessToken.access_token).toMatch(/^secret_/);
  });
});
```

### Integration Tests

```typescript
describe('Notion Integration (E2E)', () => {
  test('complete connection flow', async () => {
    // 1. Initiate OAuth
    const { url, state } = await oauthService.initiateOAuthFlow(redirectUri);

    // 2. Simulate OAuth callback
    const token = await oauthService.handleCallback('test_code', state);

    // 3. Verify token stored
    expect(token).toBeDefined();

    // 4. Verify link created
    const link = await NotionAccessTokenUser.findByUserId(userId);
    expect(link.accessToken).toBe(token.accessToken.access_token);

    // 5. Search databases
    const databases = await oauthService.refreshDatabases(userId);
    expect(databases.length).toBeGreaterThan(0);
  });
});
```

---

## Related Documentation

- **User Stories:** `planning/units/U2_notion_integration.md`
- **API Endpoints:** `.claude/technical/api-reference.md`
- **Database Schema:** `.claude/technical/database-schema.md`
- **Notion Integration Guide:** `.claude/features/notion-integration.md`
