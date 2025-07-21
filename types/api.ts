import type { User } from '@supabase/supabase-js';
import type { UserProfile, NotionAuth } from '~/stores/user';
import type { Subscription } from '~/stores/subscription';
import type { TodoList, Todo } from '~/stores/todos';

// Re-export the API response types from lib
export type { ApiResponse, ApiError, ErrorCode } from '~/lib/api-response';

// User API responses
export interface UserProfileResponse {
  profile: UserProfile
}

export interface NotionAuthResponse {
  notionAuth: NotionAuth
}

// Subscription API responses
export interface SubscriptionResponse {
  subscription: Subscription | null
}

export interface CheckoutSessionResponse {
  url: string
  sessionId: string
}

export interface PortalSessionResponse {
  url: string
}

// Todo API responses
export interface TodoListsResponse {
  todo_lists: TodoList[]
}

export interface TodoListResponse {
  todo_list: TodoList
}

export interface TodosResponse {
  todos: Todo[]
  list: TodoList
}

export interface SyncToNotionRequest {
  listId: string
  todoId: string
  checked: boolean
}

export interface CreateTodoListRequest {
  notion_database_id: string
}

// Notion API types
export interface NotionDatabase {
  id: string
  title: string
  icon?: {
    type: 'emoji' | 'external' | 'file'
    emoji?: string
    external?: { url: string }
    file?: { url: string }
  }
  parent: {
    type: string
    workspace?: boolean
    page_id?: string
  }
  properties: Record<string, any>
}

export interface NotionSearchResponse {
  databases: NotionDatabase[]
}

export interface NotionConnectRequest {
  code: string
  redirect_uri: string
}

export interface NotionConnectResponse {
  success: boolean
  workspace_name: string
  workspace_id: string
}

// Stripe webhook types
export interface StripeWebhookRequest {
  type: string
  data: {
    object: any
  }
}

// Auth context types (for middleware)
export interface AuthContext {
  user: User
  notion_auth?: NotionAuth
}

// Generic paginated response
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Request validation schemas
export interface UpdateSubscriptionRequest {
  tier: 'pro' | 'max'
}

export interface DebugSubscriptionQuery {
  user_id?: string
}
