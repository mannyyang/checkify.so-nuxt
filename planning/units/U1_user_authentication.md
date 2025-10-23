# Unit 1: User Authentication & Authorization

## Epic Overview
Enable users to securely sign up, log in, and manage their accounts using Google OAuth through Supabase Auth.

**Status:** 🟢 Completed
**Priority:** High
**Dependencies:** None (foundational feature)

---

## User Stories

### U1-S1: Sign Up with Google OAuth
**As a** new user
**I want to** sign up using my Google account
**So that** I can quickly create an account without managing passwords

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Sign in with Google" button
- [ ] User is redirected to Google OAuth consent screen
- [ ] Upon successful OAuth, user account is created in Supabase Auth
- [ ] User profile is automatically created with default free tier
- [ ] User is redirected to the dashboard upon successful signup
- [ ] Error messages are displayed if OAuth fails

**Technical Implementation:**
- Supabase Auth handles Google OAuth provider
- User record created in `auth.users` table
- Profile record created in `user_profiles` table with default values
- Session cookie is set for authentication

---

### U1-S2: Log In with Google OAuth
**As a** returning user
**I want to** log in using my Google account
**So that** I can access my todo lists

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Sign in with Google" button
- [ ] User is redirected to Google OAuth consent screen
- [ ] Upon successful OAuth, user session is created
- [ ] User is redirected to their dashboard
- [ ] User data (profile, todo lists) is accessible
- [ ] Error messages are displayed if login fails

**Technical Implementation:**
- Supabase Auth validates OAuth token
- Session is established with secure HTTP-only cookies
- User context is available throughout the application

---

### U1-S3: Persistent Sessions
**As a** logged-in user
**I want** my session to persist across browser sessions
**So that** I don't have to log in repeatedly

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Session persists after closing and reopening browser
- [ ] Session automatically refreshes before expiration
- [ ] User remains logged in for appropriate duration
- [ ] Session expires after configured timeout period
- [ ] User is prompted to re-authenticate after expiration

**Technical Implementation:**
- Supabase Auth manages refresh tokens
- Session stored in secure HTTP-only cookies
- Automatic token refresh on page load
- Session middleware validates on each request

---

### U1-S4: Log Out
**As a** user
**I want to** log out
**So that** I can secure my account on shared devices

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] User can click "Log out" button
- [ ] Session is invalidated immediately
- [ ] User is redirected to login page
- [ ] All auth tokens are cleared
- [ ] User cannot access protected routes after logout
- [ ] Pinia stores are reset on logout

**Technical Implementation:**
- Supabase Auth `signOut()` method called
- Session cookies cleared
- User redirected to `/login`
- Application state reset

---

### U1-S5: Protected Routes
**As a** user
**I want** protected routes to redirect me to login
**So that** my data stays secure

**Status:** 🟢 Completed

**Acceptance Criteria:**
- [ ] Unauthenticated users are redirected to login page
- [ ] Public routes (landing page, pricing) are accessible without login
- [ ] Protected routes (dashboard, todo lists) require authentication
- [ ] Redirect preserves intended destination after login
- [ ] Server-side validation prevents API access without auth

**Technical Implementation:**
- Nuxt middleware checks authentication state
- Server middleware validates session for API routes
- Public routes explicitly configured
- Row Level Security (RLS) enforces database permissions

---

## Technical Architecture

### Components

#### 1. User
**Attributes:**
- `id` (uuid, PK): Unique user identifier
- `email` (string): User's email address from Google
- `raw_user_meta_data` (jsonb): Additional user metadata
- `created_at` (timestamp): Account creation time
- `updated_at` (timestamp): Last update time

**Behaviors:**
- `authenticate()`: Initiate Google OAuth flow
- `createSession()`: Establish authenticated session
- `logout()`: Invalidate session and clear tokens
- `refreshSession()`: Renew authentication token

**Business Rules:**
- Email must be unique
- Must use valid Google account
- Session timeout: configurable (default 7 days)

#### 2. UserProfile
**Attributes:**
- `id` (uuid, PK): Profile identifier
- `user_id` (uuid, FK → auth.users): Reference to user
- `subscription_tier` (string): Current tier (default: 'free')
- `stripe_customer_id` (string, nullable): Stripe customer reference
- `stripe_subscription_id` (string, nullable): Active subscription
- `stripe_subscription_status` (string, nullable): Subscription status
- `stripe_current_period_end` (timestamp, nullable): Billing period end
- `created_at` (timestamp): Profile creation time
- `updated_at` (timestamp): Last update time

**Behaviors:**
- `initialize()`: Create profile with default tier
- `updateTier()`: Change subscription tier
- `getSubscriptionStatus()`: Check active subscription

**Business Rules:**
- One profile per user (1:1 relationship)
- Default tier is 'free'
- Automatically created on user signup

---

## Component Interactions

### Authentication Flow
```
User → Login Page
  ↓
Click "Sign in with Google"
  ↓
Redirect to Google OAuth
  ↓
User Grants Permission
  ↓
OAuth Callback
  ↓
Supabase Auth validates token
  ↓
Create/Update User record
  ↓
Create Session (if new user, create UserProfile)
  ↓
Set HTTP-only cookie
  ↓
Redirect to Dashboard
```

### Session Management
```
Page Load
  ↓
Middleware checks for session cookie
  ↓
Valid session? → Continue to page
  ↓
Invalid/Expired? → Attempt refresh
  ↓
Refresh success? → Update session, continue
  ↓
Refresh fail? → Redirect to login
```

### Logout Flow
```
User clicks "Log out"
  ↓
Call supabase.auth.signOut()
  ↓
Clear session cookies
  ↓
Reset Pinia stores
  ↓
Redirect to /login
```

---

## Database Schema

### auth.users (Managed by Supabase)
```sql
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    encrypted_password VARCHAR,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    raw_user_meta_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### user_profiles
```sql
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_status TEXT,
    stripe_current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

---

## Security Considerations

### Row Level Security (RLS)
```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);
```

### Session Security
- HTTP-only cookies prevent XSS attacks
- Secure flag ensures HTTPS transmission
- SameSite attribute prevents CSRF attacks
- Short token expiration with refresh mechanism

### OAuth Security
- State parameter prevents CSRF in OAuth flow
- PKCE (Proof Key for Code Exchange) used for added security
- Redirect URIs validated against whitelist
- Tokens never exposed to client JavaScript

---

## API Endpoints

### Authentication Endpoints (Handled by Supabase)
- `POST /auth/v1/signup` - Create new user account
- `POST /auth/v1/token?grant_type=password` - Login with credentials
- `POST /auth/v1/logout` - End session
- `POST /auth/v1/token?grant_type=refresh_token` - Refresh session
- `GET /auth/v1/user` - Get current user

### Custom API Endpoints
None required for basic authentication (Supabase handles all auth operations)

---

## Testing Scenarios

### Test Case 1: Successful Signup
1. Navigate to /login
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify redirect to dashboard
5. Verify user record in database
6. Verify profile created with free tier

### Test Case 2: Successful Login
1. Navigate to /login (as existing user)
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirect to dashboard
5. Verify session cookie is set

### Test Case 3: Session Persistence
1. Log in successfully
2. Close browser
3. Reopen browser and navigate to app
4. Verify user still logged in
5. Verify data accessible

### Test Case 4: Protected Route Redirect
1. Navigate to /app (without authentication)
2. Verify redirect to /login
3. Log in successfully
4. Verify redirect back to /app

### Test Case 5: Logout
1. Log in successfully
2. Click "Log out"
3. Verify redirect to /login
4. Verify cannot access protected routes
5. Verify session cookie cleared

---

## Related Documentation
- [Authentication Guide](.claude/getting-started/authentication.md)
- [Database Schema](.claude/technical/database-schema.md)
- [Architecture Overview](.claude/technical/architecture.md)
