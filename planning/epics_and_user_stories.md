# Checkify.so - Epics and User Stories

This document tracks all epics and user stories for the Checkify.so project. Stories are organized by feature units and tracked through their lifecycle.

**Status Legend:**
- 🔵 **Not Started** - Story has been identified but work hasn't begun
- 🟡 **In Progress** - Currently being implemented
- 🟢 **Completed** - Implementation finished and deployed

---

## Epic 1: User Authentication & Authorization
**Unit:** U1_User_Authentication
**Status:** 🟢 Completed
**Description:** Enable users to securely sign up, log in, and manage their accounts using Google OAuth through Supabase Auth.

### User Stories

| ID | Story | Status | Priority |
|----|-------|--------|----------|
| U1-S1 | As a new user, I want to sign up using my Google account so that I can quickly create an account without managing passwords | 🟢 Completed | High |
| U1-S2 | As a returning user, I want to log in using my Google account so that I can access my todo lists | 🟢 Completed | High |
| U1-S3 | As a logged-in user, I want my session to persist across browser sessions so that I don't have to log in repeatedly | 🟢 Completed | Medium |
| U1-S4 | As a user, I want to log out so that I can secure my account on shared devices | 🟢 Completed | Medium |
| U1-S5 | As a user, I want protected routes to redirect me to login so that my data stays secure | 🟢 Completed | High |

---

## Epic 2: Notion Integration
**Unit:** U2_Notion_Integration
**Status:** 🟢 Completed
**Description:** Connect users' Notion workspaces to Checkify through OAuth, allowing access to databases and blocks.

### User Stories

| ID | Story | Status | Priority |
|----|-------|--------|----------|
| U2-S1 | As a user, I want to connect my Notion workspace so that I can sync my todos from Notion | 🟢 Completed | High |
| U2-S2 | As a user, I want to grant specific permissions to Checkify so that I maintain control over what data is accessed | 🟢 Completed | High |
| U2-S3 | As a user, I want to see all my available Notion databases so that I can select which ones to sync | 🟢 Completed | High |
| U2-S4 | As a user, I want my Notion access token to be securely stored so that my Notion data remains protected | 🟢 Completed | High |
| U2-S5 | As a user, I want to disconnect my Notion workspace so that I can revoke access when needed | 🟢 Completed | Medium |
| U2-S6 | As a user, I want to reconnect my Notion workspace if my token expires so that I can restore sync functionality | 🟢 Completed | Medium |

---

## Epic 3: Todo Management
**Unit:** U3_Todo_Management
**Status:** 🟢 Completed
**Description:** Extract, display, filter, and manage todos from connected Notion databases in a unified interface.

### User Stories

| ID | Story | Status | Priority |
|----|-------|--------|----------|
| U3-S1 | As a user, I want to create a todo list from a Notion database so that I can view all my todos in one place | 🟢 Completed | High |
| U3-S2 | As a user, I want to see all pages from my selected database so that I can navigate to specific todos | 🟢 Completed | High |
| U3-S3 | As a user, I want to see all checkbox blocks extracted from my Notion pages so that I can manage my tasks | 🟢 Completed | High |
| U3-S4 | As a user, I want to view my todos organized by page so that I maintain context from Notion | 🟢 Completed | Medium |
| U3-S5 | As a user, I want to search and filter my todos so that I can find specific tasks quickly | 🟢 Completed | Medium |
| U3-S6 | As a user, I want to see todo metadata (tags, priority, due dates) so that I can manage tasks effectively | 🟢 Completed | Low |
| U3-S7 | As a user, I want to delete a todo list so that I can remove databases I no longer want to track | 🟢 Completed | Medium |
| U3-S8 | As a user, I want to see extraction metadata (total pages, checkboxes found) so that I understand what was synced | 🟢 Completed | Low |

---

## Epic 4: Checkbox Synchronization
**Unit:** U4_Checkbox_Synchronization
**Status:** 🟢 Completed
**Description:** Enable bidirectional sync of checkbox states between Checkify and Notion for real-time task management.

### User Stories

| ID | Story | Status | Priority |
|----|-------|--------|----------|
| U4-S1 | As a user, I want to check off a todo in Checkify so that it updates in my Notion workspace | 🟢 Completed | High |
| U4-S2 | As a user, I want checkbox changes to sync immediately so that I see instant feedback | 🟢 Completed | High |
| U4-S3 | As a user, I want optimistic UI updates so that the interface feels responsive | 🟢 Completed | Medium |
| U4-S4 | As a user, I want failed syncs to revert and notify me so that I know when changes didn't save | 🟢 Completed | Medium |
| U4-S5 | As a user, I want to manually refresh my todo list so that I can pull the latest changes from Notion | 🟢 Completed | Medium |
| U4-S6 | As a user, I want to see the last sync time so that I know how current my data is | 🟢 Completed | Low |

---

## Epic 5: Subscription & Billing
**Unit:** U5_Subscription_Billing
**Status:** 🟢 Completed
**Description:** Manage subscription tiers (Free, Pro, Max) with Stripe integration for payments and tier limit enforcement.

### User Stories

| ID | Story | Status | Priority |
|----|-------|--------|----------|
| U5-S1 | As a new user, I want to start with a free tier so that I can try the service before paying | 🟢 Completed | High |
| U5-S2 | As a free user, I want to see tier limits (25 pages, 25 checkboxes/page, 2 lists) enforced so that I understand usage constraints | 🟢 Completed | High |
| U5-S3 | As a user, I want to upgrade to Pro ($6.99/mo) so that I can access more pages and checkboxes | 🟢 Completed | High |
| U5-S4 | As a user, I want to upgrade to Max ($19.99/mo) so that I can have unlimited access | 🟢 Completed | High |
| U5-S5 | As a user, I want to be redirected to Stripe Checkout so that I can securely pay for my subscription | 🟢 Completed | High |
| U5-S6 | As a user, I want my tier to update automatically after payment so that I immediately get access to new limits | 🟢 Completed | High |
| U5-S7 | As a subscriber, I want to manage my subscription through Stripe Customer Portal so that I can update payment methods or cancel | 🟢 Completed | Medium |
| U5-S8 | As a user, I want to see my current tier and limits in the UI so that I know what I have access to | 🟢 Completed | Medium |
| U5-S9 | As a user hitting a tier limit, I want to see an upgrade prompt so that I know how to get more access | 🟢 Completed | Medium |

---

## Epic 6: Sync to Notion Database
**Unit:** U6_Sync_To_Notion_Database
**Status:** 🟢 Completed
**Description:** Create a centralized Notion database aggregating all todos from multiple databases for comprehensive tracking.

### User Stories

| ID | Story | Status | Priority |
|----|-------|--------|----------|
| U6-S1 | As a user, I want to create a dedicated Notion database with all my todos so that I have a single source of truth in Notion | 🟢 Completed | High |
| U6-S2 | As a user, I want each todo synced with metadata (page title, URL, database, checked status) so that I have full context | 🟢 Completed | High |
| U6-S3 | As a user, I want to trigger a manual sync to my Notion database so that I can update it on demand | 🟢 Completed | Medium |
| U6-S4 | As a user, I want to see sync status and last sync time so that I know when my Notion database was updated | 🟢 Completed | Medium |
| U6-S5 | As a user, I want synced pages to maintain links to original Notion pages so that I can navigate to source content | 🟢 Completed | Medium |
| U6-S6 | As a user, I want extraction metadata stored with my sync so that I can track what was processed | 🟢 Completed | Low |

---

## Epic 7: Analytics & Tracking
**Unit:** U7_Analytics_Tracking
**Status:** 🟢 Completed
**Description:** Integrate PostHog and Umami for feature usage analytics and privacy-friendly web analytics.

### User Stories

| ID | Story | Status | Priority |
|----|-------|--------|----------|
| U7-S1 | As a product owner, I want to track feature usage with PostHog so that I can understand user behavior | 🟢 Completed | Medium |
| U7-S2 | As a product owner, I want to track page views with Umami so that I can see traffic patterns | 🟢 Completed | Medium |
| U7-S3 | As a user, I want my privacy respected with GDPR-compliant analytics so that my data isn't misused | 🟢 Completed | High |
| U7-S4 | As a developer, I want analytics configured via environment variables so that I can enable/disable tracking easily | 🟢 Completed | Low |
| U7-S5 | As a product owner, I want to track key user journeys (signup, Notion connect, todo list creation) so that I can identify drop-off points | 🟢 Completed | Medium |

---

## Epic 8: Infrastructure & DevOps
**Unit:** U8_Infrastructure_Devops
**Status:** 🟢 Completed
**Description:** Deploy, monitor, and maintain the application infrastructure with proper caching, error handling, and performance optimization.

### User Stories

| ID | Story | Status | Priority |
|----|-------|--------|----------|
| U8-S1 | As a developer, I want the app deployed on a reliable platform so that users have consistent uptime | 🟢 Completed | High |
| U8-S2 | As a developer, I want environment variables securely managed so that secrets aren't exposed | 🟢 Completed | High |
| U8-S3 | As a user, I want fast page loads through SSR so that I have a good experience | 🟢 Completed | Medium |
| U8-S4 | As a developer, I want Notion data cached in Supabase so that API rate limits aren't exceeded | 🟢 Completed | High |
| U8-S5 | As a developer, I want proper error handling and logging so that I can debug issues quickly | 🟢 Completed | Medium |
| U8-S6 | As a developer, I want automated testing with Vitest so that I can catch bugs before deployment | 🟢 Completed | Medium |
| U8-S7 | As a developer, I want linting and code quality tools so that code remains maintainable | 🟢 Completed | Low |
| U8-S8 | As a user, I want database queries optimized with indexes so that the app performs well at scale | 🟢 Completed | Medium |

---

## Summary Statistics

| Epic | Total Stories | Completed | In Progress | Not Started |
|------|---------------|-----------|-------------|-------------|
| E1: User Authentication | 5 | 5 | 0 | 0 |
| E2: Notion Integration | 6 | 6 | 0 | 0 |
| E3: Todo Management | 8 | 8 | 0 | 0 |
| E4: Checkbox Sync | 6 | 6 | 0 | 0 |
| E5: Subscription & Billing | 9 | 9 | 0 | 0 |
| E6: Sync to Notion DB | 6 | 6 | 0 | 0 |
| E7: Analytics | 5 | 5 | 0 | 0 |
| E8: Infrastructure | 8 | 8 | 0 | 0 |
| **TOTAL** | **53** | **53** | **0** | **0** |

---

## Notes

- This document represents the current state of Checkify.so based on the existing codebase
- All stories reflect already-implemented features extracted through code analysis
- Future feature additions should be added to this document with 🔵 Not Started status
- User stories follow the format: "As a [role], I want [feature] so that [benefit]"
- Priority levels: High (core functionality), Medium (important features), Low (nice-to-have)
