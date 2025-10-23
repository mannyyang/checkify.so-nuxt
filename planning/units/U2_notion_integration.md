# Unit 2: Notion Integration

## Epic Overview
Connect users' Notion workspaces to Checkify through OAuth, allowing access to databases and blocks.

**Status:** 🟢 Completed
**Priority:** High
**Dependencies:** U1 (User Authentication)

---

## User Stories

### U2-S1: Connect Notion Workspace
**As a** user
**I want to** connect my Notion workspace
**So that** I can sync my todos from Notion

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Connect Notion" button
- [ ] User is redirected to Notion OAuth consent screen
- [ ] User can select which pages to grant access to
- [ ] Upon successful OAuth, access token is securely stored
- [ ] User is redirected back to app after connection
- [ ] Success message is displayed upon successful connection

**Technical Implementation:**
- Notion OAuth 2.0 integration
- Access token stored in `notion_access_token` and `notion_access_token_user` tables
- OAuth callback handled by `/api/connect-notion`

---

### U2-S2: Grant Specific Permissions
**As a** user
**I want to** grant specific permissions to Checkify
**So that** I maintain control over what data is accessed

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Notion OAuth consent screen shows requested permissions
- [ ] User can select specific databases to share
- [ ] User can see what data will be accessed
- [ ] User can revoke access at any time from Notion
- [ ] Only granted databases are accessible to Checkify

**Technical Implementation:**
- Notion OAuth scopes requested
- User selects databases during OAuth flow
- Bot integration added to selected pages

---

### U2-S3: View Available Notion Databases
**As a** user
**I want to** see all my available Notion databases
**So that** I can select which ones to sync

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can see list of all accessible Notion databases
- [ ] Database name and icon are displayed
- [ ] User can search/filter databases
- [ ] Only databases with granted access are shown
- [ ] Database metadata is cached for performance

**Technical Implementation:**
- `/api/search-notion` endpoint queries Notion API
- Databases fetched using `notion.search()` API
- Results stored in `notion_database` table
- UI displays database list with icons and names

---

### U2-S4: Secure Token Storage
**As a** user
**I want** my Notion access token to be securely stored
**So that** my Notion data remains protected

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Access token never exposed to client-side JavaScript
- [ ] Token stored encrypted in database
- [ ] Token only accessible via server-side API
- [ ] Row Level Security prevents access to other users' tokens
- [ ] Token validated before use

**Technical Implementation:**
- Tokens stored server-side only
- RLS policies on `notion_access_token_user` table
- Server API routes access tokens
- No token in client-side state or cookies

---

### U2-S5: Disconnect Notion Workspace
**As a** user
**I want to** disconnect my Notion workspace
**So that** I can revoke access when needed

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Disconnect Notion" button
- [ ] Access token is removed from database
- [ ] All associated todo lists are deleted
- [ ] User receives confirmation before disconnection
- [ ] Success message displayed after disconnection

**Technical Implementation:**
- Cascade delete removes all related data
- Token removed from `notion_access_token_user`
- Associated `todo_list` records deleted

---

### U2-S6: Reconnect After Token Expiration
**As a** user
**I want to** reconnect my Notion workspace if my token expires
**So that** I can restore sync functionality

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User is notified when token is invalid/expired
- [ ] User can click "Reconnect Notion" button
- [ ] OAuth flow initiated to get new token
- [ ] Existing todo lists are preserved
- [ ] New token updates database record

**Technical Implementation:**
- API errors detect invalid tokens
- UI shows reconnection prompt
- OAuth flow updates existing token record
- Todo lists remain linked to same databases

---

## Technical Architecture

### Components

#### 1. NotionAccessToken
**Attributes:**
- `id` (bigint, PK): Token record identifier
- `access_token` (jsonb): Complete OAuth response from Notion
- `created_at` (timestamp): Token creation time

**Behaviors:**
- `store()`: Save OAuth response
- `validate()`: Check token validity
- `revoke()`: Remove token

**Business Rules:**
- Stores complete OAuth response including metadata
- Preserves workspace info and bot ID

#### 2. NotionAccessTokenUser
**Attributes:**
- `id` (bigint, PK): User token link identifier
- `user_id` (uuid, FK → auth.users): Reference to user
- `access_token` (string): Notion access token (from OAuth response)
- `created_at` (timestamp): Link creation time

**Behaviors:**
- `link()`: Associate token with user
- `getToken()`: Retrieve user's token
- `removeToken()`: Delete token link

**Business Rules:**
- One token per user (enforced by UNIQUE constraint)
- Cascade delete when user is deleted

#### 3. NotionDatabase
**Attributes:**
- `id` (bigint, PK): Database record identifier
- `notion_database_id` (string, unique): Notion's database ID
- `name` (string): Database name/title
- `metadata` (jsonb): Complete database object from Notion
- `access_token` (string): Token used to access this database
- `created_at` (timestamp): Record creation time

**Behaviors:**
- `fetchFromNotion()`: Query Notion API for database
- `updateMetadata()`: Refresh database info
- `getPages()`: Retrieve pages within database

**Business Rules:**
- Unique constraint on `notion_database_id`
- Metadata includes icon, properties schema
- Cached to reduce API calls

#### 4. NotionClient (Service)
**Attributes:**
- `accessToken` (string): OAuth token for API calls
- `client` (Client): Notion SDK client instance

**Behaviors:**
- `searchDatabases()`: Find accessible databases
- `queryDatabase()`: Get pages from database
- `getPageBlocks()`: Retrieve blocks from page
- `updateBlock()`: Modify block (e.g., checkbox state)

**Business Rules:**
- All Notion API calls go through this service
- Handles rate limiting and errors
- Validates token before each request

---

## Component Interactions

### Notion Connection Flow
```
User clicks "Connect Notion"
  ↓
Redirect to Notion OAuth (/api/auth-notion)
  ↓
User grants permission in Notion
  ↓
OAuth callback (/api/connect-notion)
  ↓
Store access_token in notion_access_token
  ↓
Link token to user in notion_access_token_user
  ↓
Fetch accessible databases
  ↓
Store databases in notion_database
  ↓
Redirect to database selection page
```

### Database Search Flow
```
User navigates to "Select Databases"
  ↓
Call /api/search-notion
  ↓
Server retrieves user's access token
  ↓
Query Notion API: notion.search({ filter: "database" })
  ↓
For each database result:
  - Store in notion_database table
  - Cache metadata
  ↓
Return list to client
  ↓
Display databases with icons and names
```

### Token Validation Flow
```
API request requires Notion access
  ↓
Retrieve token from notion_access_token_user
  ↓
Attempt Notion API call
  ↓
Success? → Continue with request
  ↓
Invalid token error? → Return 401 with reconnect prompt
  ↓
Client shows "Reconnect Notion" button
```

---

## Database Schema

### notion_access_token
```sql
CREATE TABLE notion_access_token (
    id BIGSERIAL PRIMARY KEY,
    access_token JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Sample OAuth Response:**
```json
{
  "access_token": "secret_abc123...",
  "token_type": "bearer",
  "bot_id": "bot-uuid-123",
  "workspace_name": "My Workspace",
  "workspace_id": "workspace-uuid-456",
  "owner": {
    "type": "user",
    "user": {
      "id": "user-uuid-789",
      "name": "John Doe",
      "avatar_url": "https://...",
      "type": "person",
      "person": { "email": "john@example.com" }
    }
  },
  "duplicated_template_id": null,
  "request_id": "request-uuid"
}
```

### notion_access_token_user
```sql
CREATE TABLE notion_access_token_user (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_notion_token_user ON notion_access_token_user(user_id);
```

### notion_database
```sql
CREATE TABLE notion_database (
    id BIGSERIAL PRIMARY KEY,
    notion_database_id VARCHAR NOT NULL UNIQUE,
    name VARCHAR,
    metadata JSONB,
    access_token VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notion_database_id ON notion_database(notion_database_id);
```

**Sample Metadata:**
```json
{
  "id": "database-uuid-123",
  "object": "database",
  "created_time": "2024-01-01T00:00:00.000Z",
  "last_edited_time": "2024-01-15T12:00:00.000Z",
  "title": [{ "type": "text", "text": { "content": "My Tasks" } }],
  "icon": { "type": "emoji", "emoji": "📝" },
  "cover": null,
  "properties": {
    "Name": { "id": "title", "type": "title", "title": {} },
    "Status": { "id": "status", "type": "select", "select": {} }
  }
}
```

---

## Security Considerations

### Row Level Security
```sql
ALTER TABLE notion_access_token_user ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token" ON notion_access_token_user
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token" ON notion_access_token_user
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own token" ON notion_access_token_user
    FOR DELETE USING (auth.uid() = user_id);
```

### OAuth Security
- Redirect URI validation
- State parameter prevents CSRF
- Token exchange happens server-side only
- No client secret in frontend code

---

## API Endpoints

### GET /api/auth-notion
**Description:** Initiate Notion OAuth flow

**Response:**
- Redirect to Notion OAuth consent page

---

### POST /api/connect-notion
**Description:** OAuth callback handler

**Query Parameters:**
- `code`: OAuth authorization code
- `state`: CSRF protection token

**Response:**
```json
{
  "success": true,
  "message": "Notion connected successfully"
}
```

**Actions:**
1. Exchange code for access token
2. Store token in database
3. Link to current user

---

### GET /api/search-notion
**Description:** Search for accessible Notion databases

**Response:**
```json
{
  "databases": [
    {
      "id": "database-uuid",
      "name": "My Tasks",
      "icon": { "type": "emoji", "emoji": "📝" },
      "metadata": { ... }
    }
  ]
}
```

---

## Testing Scenarios

### Test Case 1: Successful Connection
1. Navigate to Connect Notion page
2. Click "Connect Notion"
3. Complete Notion OAuth flow
4. Verify redirect to database selection
5. Verify token stored in database
6. Verify `notion_access_token_user` record created

### Test Case 2: Database Search
1. Connect Notion successfully
2. Navigate to database selection
3. Verify list of databases displayed
4. Verify database icons and names shown
5. Verify databases stored in `notion_database`

### Test Case 3: Disconnect Notion
1. Connect Notion successfully
2. Click "Disconnect Notion"
3. Confirm disconnection
4. Verify token removed from database
5. Verify associated todo lists deleted

### Test Case 4: Token Expiration Handling
1. Simulate expired/invalid token
2. Attempt to access Notion data
3. Verify error is caught
4. Verify "Reconnect Notion" prompt shown
5. Click reconnect and complete OAuth
6. Verify token updated in database

---

## Related Documentation
- [Notion Integration Guide](.claude/features/notion-integration.md)
- [API Reference](.claude/technical/api-reference.md)
- [Database Schema](.claude/technical/database-schema.md)
