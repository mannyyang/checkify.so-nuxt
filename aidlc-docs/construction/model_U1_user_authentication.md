# Domain Model: U1 - User Authentication & Authorization

## Overview
This domain model defines the components, attributes, behaviors, and interactions required to implement user authentication and authorization using Google OAuth through Supabase Auth.

**Related User Stories:** See `planning/units/U1_user_authentication.md`

---

## Domain Components

### 1. User (Domain Entity)

#### Purpose
Represents an authenticated user in the system. This is the core identity entity managed by Supabase Auth.

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | UUID | Yes | Generated | Unique user identifier (primary key) |
| `email` | String | Yes | - | User's email address from Google OAuth |
| `emailConfirmed` | Boolean | Yes | false | Whether email is verified |
| `rawUserMetaData` | JSONB | No | {} | Additional metadata from OAuth provider |
| `createdAt` | Timestamp | Yes | NOW() | Account creation time |
| `updatedAt` | Timestamp | Yes | NOW() | Last update time |

#### Behaviors

**authenticate(googleToken: string): Promise<Session>**
- Validates Google OAuth token with Supabase
- Creates or retrieves existing user account
- Establishes authenticated session
- Returns session object with access/refresh tokens

**createSession(): Promise<Session>**
- Generates new authentication session
- Creates secure HTTP-only cookies
- Sets session expiration time
- Returns session metadata

**refreshSession(refreshToken: string): Promise<Session>**
- Validates refresh token
- Issues new access token
- Extends session validity
- Updates session cookies

**logout(): Promise<void>**
- Invalidates current session
- Clears all authentication tokens
- Removes session cookies
- Triggers application state reset

**validateSession(accessToken: string): Promise<boolean>**
- Checks if access token is valid
- Verifies token signature
- Ensures token not expired
- Returns validation status

#### Business Rules

1. **Uniqueness:** Email must be unique across all users
2. **OAuth Only:** Users can only authenticate via Google OAuth (no password authentication)
3. **Session Duration:** Default session lasts 7 days before requiring re-authentication
4. **Auto-Creation:** User account and profile created automatically on first OAuth success
5. **Email Verification:** Email automatically verified when using Google OAuth

#### State Diagram

```
          [Unauthenticated]
                 |
                 | authenticate()
                 ↓
          [Authenticated]
                 |
        ┌────────┼────────┐
        │                 │
        | refreshSession() | logout()
        ↓                 ↓
  [Authenticated]  [Unauthenticated]
```

---

### 2. UserProfile (Domain Entity)

#### Purpose
Stores extended user information including subscription tier and billing details. One-to-one relationship with User.

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | UUID | Yes | Generated | Profile identifier (primary key) |
| `userId` | UUID | Yes | - | Foreign key to User (unique) |
| `subscriptionTier` | Enum | Yes | 'free' | Current subscription tier ('free', 'pro', 'max') |
| `stripeCustomerId` | String | No | null | Stripe customer identifier (UNIQUE) |
| `subscriptionStatus` | String | Yes | 'active' | Subscription status ('active', 'canceled', 'past_due', 'trialing') |
| `subscriptionExpiresAt` | Timestamp | No | null | When canceled subscription expires |
| `createdAt` | Timestamp | Yes | NOW() | Profile creation time |
| `updatedAt` | Timestamp | Yes | NOW() | Last modification time |

#### Behaviors

**initialize(userId: UUID): Promise<UserProfile>**
- Creates new profile for user
- Sets default tier to 'free'
- Initializes all nullable fields to null
- Returns created profile

**updateTier(tier: SubscriptionTier): Promise<void>**
- Updates subscription tier
- Validates tier value
- Updates timestamp
- Triggers tier limit recalculation

**getSubscriptionStatus(): SubscriptionStatus**
- Retrieves current subscription state
- Checks Stripe subscription status
- Determines if subscription is active
- Returns normalized status

**syncWithStripe(stripeData: StripeSubscription): Promise<void>**
- Updates profile with Stripe subscription data
- Sets customer ID and subscription ID
- Updates subscription status
- Sets billing period end date

**getTierLimits(): TierLimits**
- Retrieves limits for current tier
- Returns object with page/checkbox/list limits
- Used for quota enforcement

#### Business Rules

1. **One-to-One:** Each user has exactly one profile
2. **Cascade Delete:** Profile deleted when user is deleted
3. **Default Tier:** New profiles default to 'free' tier
4. **Auto-Creation:** Profile created automatically during user signup
5. **Tier Validation:** Subscription tier must be one of: 'free', 'pro', 'max'

#### State Diagram

```
        [Created: Free Tier]
                 |
                 | updateTier('pro')
                 ↓
          [Pro Tier Active]
                 |
        ┌────────┼────────┐
        |                 |
        | cancel()        | updateTier('max')
        ↓                 ↓
  [Free Tier]      [Max Tier Active]
```

---

### 3. Session Management (Delegated to Supabase)

#### Purpose
Session management is fully delegated to Supabase Auth SDK. No custom Session value object is implemented.

#### Supabase Session Type

The application uses the `Session` type from `@supabase/supabase-js`:

```typescript
interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: User
}
```

#### Session Storage

**Implementation:**
- Tokens stored in HTTP-only cookies by Nuxt Supabase module
- Secure flag ensures HTTPS-only transmission
- SameSite=Lax prevents CSRF attacks
- No client-side JavaScript access to tokens

**Configuration (supabase/config.toml):**
```toml
jwt_expiry = 3600  # 1 hour
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
```

#### Session Validation

**Automatic Validation:**
- Nuxt Supabase module validates sessions on each request
- Expired tokens automatically refreshed if refresh token valid
- Failed refresh redirects to login

**No Custom Methods:**
- No `isValid()` method (handled by Supabase)
- No `needsRefresh()` method (automatic)
- No `toJSON()` method needed

#### Business Rules

1. **HTTP-Only Cookies:** Enforced by Nuxt Supabase module
2. **Auto-Refresh:** Handled automatically by SDK
3. **Token Rotation:** Refresh tokens rotated on use
4. **Short-Lived Access Tokens:** 1 hour expiration

---

### 4. Authentication Implementation (No Service Class)

#### Purpose
Authentication is handled directly by Supabase SDK via composables and utility functions, not through a dedicated service class.

#### Client-Side Implementation

**Composable: `useSupabaseClient()`**
- Nuxt Supabase module provides this composable
- Used in components for auth operations
- Automatically handles session management

**Example Usage (pages/login.vue):**
```typescript
const supabase = useSupabaseClient()

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl.value
    }
  })
}
```

#### Server-Side Implementation

**Utility: `serverSupabaseUser(event)`**
- Server-side helper to get current user
- Validates session automatically
- Returns User object or null

**Utility: `getSupabaseUser(event)`**
- Gets authenticated user from event context
- Throws 401 error if not authenticated
- Used in protected API routes

**Example Usage (server/api/*):**
```typescript
export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  // User is authenticated
})
```

#### Middleware Integration

**Middleware: `server/middleware/auth.ts`**
- Runs on every request
- Attaches user to `event.context.user`
- Fetches Notion auth if available
- Does not block requests (permissive)

#### Business Rules

1. **Delegated to Supabase:** All auth operations handled by Supabase SDK
2. **No Custom Service:** No AuthenticationService class implemented
3. **Module Integration:** Nuxt Supabase module manages tokens and sessions
4. **Automatic Refresh:** Token refresh handled by Supabase module

---

### 5. Pinia Stores (State Management)

#### UserStore

**Purpose:** Manages user authentication state and profile data on the client-side.

**Location:** `stores/user.ts`

**State:**
```typescript
{
  user: User | null,          // Current authenticated user
  profile: UserProfile | null, // User's profile with subscription
  notionAuth: NotionAuth | null, // Notion connection status
  isLoading: boolean,         // Loading state
  error: string | null        // Error messages
}
```

**Actions:**
- `setUser(user)`: Update user object
- `setProfile(profile)`: Update profile object
- `setNotionAuth(auth)`: Update Notion auth status
- `fetchProfile()`: Load profile from API
- `fetchNotionAuth()`: Load Notion connection status
- `initialize()`: Setup store on app load
- `reset()`: Clear all state (on logout)

**Usage Example:**
```typescript
const userStore = useUserStore()
await userStore.initialize()  // Load user data
console.log(userStore.profile?.subscription_tier)  // Access tier
```

#### SubscriptionStore

**Purpose:** Manages subscription tier and limits.

**Location:** `stores/subscription.ts`

**State:**
```typescript
{
  subscription: Subscription | null,
  limits: TierLimits | null,
  isLoading: boolean,
  error: string | null
}
```

**Getters:**
- `tier`: Current subscription tier
- `isActive`: Whether subscription is active
- `isPro`: Whether user has Pro tier
- `isMax`: Whether user has Max tier
- `databaseLimit`: Max databases allowed
- `todoLimit`: Max todos per database

**Actions:**
- `fetchSubscription()`: Load subscription from API
- `syncSubscription()`: Sync with Stripe
- `createCheckoutSession(tier)`: Start upgrade flow
- `createPortalSession()`: Open billing portal

---

## Component Interactions

### User Signup/Login Flow

```
┌──────────────────┐
│  User Browser    │
└────────┬─────────┘
         │
         │ 1. Click "Sign in with Google"
         │
         ↓
┌────────────────────────────────┐
│  AuthenticationService         │
│  signInWithGoogle()            │
│  - Generate state              │
│  - Build OAuth URL             │
└────────┬───────────────────────┘
         │
         │ 2. Redirect to Google OAuth
         │
         ↓
┌──────────────────┐
│  Google OAuth    │
│  (External)      │
└────────┬─────────┘
         │
         │ 3. User grants permission
         │
         ↓
┌────────────────────────────────┐
│  AuthenticationService         │
│  handleOAuthCallback()         │
│  - Validate state              │
│  - Exchange code for tokens    │
└────────┬───────────────────────┘
         │
         │ 4. Create/retrieve User
         │
         ↓
┌──────────────────┐
│  User Entity     │
│  authenticate()  │
└────────┬─────────┘
         │
         │ 5. Create session
         │
         ↓
┌──────────────────┐
│  Session         │
│  (created)       │
└────────┬─────────┘
         │
         │ 6. Check for UserProfile
         │
         ↓
┌──────────────────────────────┐
│  UserProfile Entity          │
│  initialize() (if new user)  │
│  - Set tier = 'free'         │
└──────────┬───────────────────┘
         │
         │ 7. Set session cookies
         │
         ↓
┌──────────────────┐
│  User Browser    │
│  (redirect to    │
│   dashboard)     │
└──────────────────┘
```

### Session Validation Flow (Middleware)

```
┌──────────────────┐
│  HTTP Request    │
└────────┬─────────┘
         │
         │ 1. Request to protected route
         │
         ↓
┌────────────────────────────────┐
│  Nuxt Middleware               │
│  - Extract access token from  │
│    cookies                     │
└────────┬───────────────────────┘
         │
         │ 2. Validate token
         │
         ↓
┌────────────────────────────────┐
│  AuthenticationService         │
│  validateSession(accessToken)  │
└────────┬───────────────────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
     Valid            Expired           Invalid
         │                 │                  │
         ↓                 ↓                  ↓
  ┌───────────┐    ┌──────────────┐   ┌────────────┐
  │ Continue  │    │ Attempt      │   │ Redirect   │
  │ Request   │    │ Refresh      │   │ to Login   │
  └───────────┘    └──────┬───────┘   └────────────┘
                          │
                          │
                          ↓
              ┌────────────────────────┐
              │ refreshSession()       │
              │ - Use refresh token    │
              │ - Get new access token │
              └──────┬─────────────────┘
                     │
            ┌────────┴────────┐
            │                 │
        Success           Failure
            │                 │
            ↓                 ↓
      ┌───────────┐    ┌────────────┐
      │ Continue  │    │ Redirect   │
      │ Request   │    │ to Login   │
      └───────────┘    └────────────┘
```

### Logout Flow

```
┌──────────────────┐
│  User Browser    │
└────────┬─────────┘
         │
         │ 1. Click "Logout"
         │
         ↓
┌────────────────────────────────┐
│  User Entity                   │
│  logout()                      │
└────────┬───────────────────────┘
         │
         │ 2. Call service
         │
         ↓
┌────────────────────────────────┐
│  AuthenticationService         │
│  signOut(session)              │
│  - Call Supabase signOut       │
└────────┬───────────────────────┘
         │
         │ 3. Invalidate session
         │
         ↓
┌──────────────────┐
│  Session         │
│  (invalidated)   │
└────────┬─────────┘
         │
         │ 4. Clear cookies
         │
         ↓
┌──────────────────────────────┐
│  HTTP Response               │
│  - Clear session cookies     │
│  - Redirect to /login        │
└──────────┬───────────────────┘
         │
         │ 5. Reset client state
         │
         ↓
┌──────────────────┐
│  Pinia Stores    │
│  reset()         │
└──────────────────┘
```

---

## Data Model (PostgreSQL)

### users (Managed by Supabase Auth)

```sql
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_created_at ON auth.users(created_at);
```

### user_profiles

```sql
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'max')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_tier ON user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Row Level Security (RLS) Policies

### user_profiles Table

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can do anything (for server-side operations)
CREATE POLICY "Service role has full access"
    ON user_profiles
    FOR ALL
    USING (auth.role() = 'service_role');
```

---

## Validation Rules

### Implementation Approach

Validation is enforced through multiple layers, **not through dedicated validator classes**:

1. **Database Constraints** (Primary validation)
2. **TypeScript Types** (Compile-time checking)
3. **Inline Validation** (In API routes as needed)

### Database-Level Validation

```sql
-- User Profile Tier Validation
subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro', 'max'))

-- Subscription Status Validation
subscription_status TEXT DEFAULT 'active'
  CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing'))

-- Unique Constraints
UNIQUE(user_id)
UNIQUE(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL
```

### TypeScript Type Validation

```typescript
// From stores/subscription.ts
export type SubscriptionTier = 'free' | 'pro' | 'max'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

interface UserProfile {
  user_id: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  stripe_customer_id?: string
  subscription_expires_at?: string
}
```

### API-Level Validation

**Error Handling (server/utils/supabase.ts):**
```typescript
export async function getSupabaseUser(event: H3Event) {
  const user = event.context.user
  if (!user?.id) {
    sendError(event, ErrorCodes.UNAUTHORIZED, 'User not authenticated', 401)
  }
  return user
}
```

**No Validator Classes:**
- No `UserValidator` class implemented
- No `UserProfileValidator` class implemented
- Validation happens at database and type level

---

## Error Handling

### Authentication Errors

**Implementation:** Errors handled by Supabase SDK and Nuxt error utilities, **not through custom error classes**.

### Common Error Scenarios

| Scenario | Handling | User Experience |
|----------|----------|-----------------|
| Session expired | Automatic redirect to `/login` | Transparent re-authentication |
| OAuth failure | Error displayed on login page | Retry button available |
| Invalid token | `sendError()` with 401 | API returns error response |
| Missing user | Middleware redirects | Seamless redirect to login |

### Actual Implementation

**Server-Side Error Handling:**
```typescript
// From server/utils/supabase.ts
export async function getSupabaseUser(event: H3Event) {
  const user = event.context.user
  if (!user?.id) {
    sendError(event, ErrorCodes.UNAUTHORIZED, 'User not authenticated', 401)
  }
  return user
}

// Usage in API routes
export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event) // Throws 401 if not auth'd
  // Continue with authenticated logic
})
```

**Client-Side Error Handling:**
```typescript
// From pages/login.vue
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl.value }
  })

  if (error) {
    console.error('Login error:', error)
    // Error displayed to user
  }
}
```

**No Custom Error Classes:**
- No `AuthenticationError` class exists
- Uses Nuxt's `createError()` and `sendError()` utilities
- Supabase SDK provides error objects directly

---

## Security Considerations

### Token Security
1. **HTTP-Only Cookies:** Access and refresh tokens stored in HTTP-only cookies
2. **Secure Flag:** Cookies only transmitted over HTTPS
3. **SameSite:** SameSite=Lax to prevent CSRF attacks
4. **Token Rotation:** Refresh tokens rotated on each use

### Session Management
1. **Short-Lived Access Tokens:** 1 hour expiration
2. **Refresh Token Reuse Detection:** Refresh token invalidated after single use
3. **Session Timeout:** Absolute session timeout after 7 days
4. **Concurrent Session Limit:** One session per user per device

### OAuth Security
1. **State Parameter:** CSRF protection via state parameter
2. **Redirect URI Validation:** Only whitelisted redirect URIs accepted
3. **Code Exchange:** Authorization code exchanged server-side only
4. **PKCE:** Proof Key for Code Exchange used for mobile apps (future)

---

## Testing Strategy

### Unit Tests

```typescript
describe('User Entity', () => {
  test('should create user with valid data', () => {
    const user = new User({
      email: 'test@example.com',
      id: 'uuid-123'
    });

    expect(user.email).toBe('test@example.com');
    expect(user.id).toBe('uuid-123');
  });

  test('should validate email format', () => {
    expect(() => {
      new User({ email: 'invalid-email', id: 'uuid-123' });
    }).toThrow('Invalid email format');
  });
});

describe('UserProfile Entity', () => {
  test('should initialize with free tier', () => {
    const profile = UserProfile.initialize('user-uuid-123');

    expect(profile.subscriptionTier).toBe('free');
    expect(profile.stripeCustomerId).toBeNull();
  });

  test('should update tier correctly', async () => {
    const profile = new UserProfile({ userId: 'uuid-123', tier: 'free' });
    await profile.updateTier('pro');

    expect(profile.subscriptionTier).toBe('pro');
  });
});

describe('AuthenticationService', () => {
  test('should initiate Google OAuth flow', async () => {
    const result = await authService.signInWithGoogle();

    expect(result.url).toContain('accounts.google.com');
    expect(result.url).toContain('state=');
  });
});
```

### Integration Tests

```typescript
describe('Authentication Flow (E2E)', () => {
  test('complete signup flow', async () => {
    // 1. Initiate OAuth
    const { url } = await authService.signInWithGoogle();

    // 2. Simulate OAuth callback
    const session = await authService.handleOAuthCallback(
      'auth-code-123',
      'state-456'
    );

    // 3. Verify user created
    expect(session.user).toBeDefined();
    expect(session.user.email).toBe('test@example.com');

    // 4. Verify profile created
    const profile = await UserProfile.findByUserId(session.user.id);
    expect(profile.subscriptionTier).toBe('free');
  });
});
```

---

## Related Documentation

- **User Stories:** `planning/units/U1_user_authentication.md`
- **API Endpoints:** `.claude/technical/api-reference.md`
- **Database Schema:** `.claude/technical/database-schema.md`
- **Authentication Guide:** `.claude/getting-started/authentication.md`
