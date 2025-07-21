// Database table types that match Supabase schema

export interface UserProfileModel {
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export interface NotionAuthModel {
  id: string
  user_id: string
  access_token: string
  token_type: string
  bot_id: string
  workspace_id: string
  workspace_name?: string
  workspace_icon?: string
  owner?: {
    type: string
    user?: {
      id: string
      name?: string
      avatar_url?: string
    }
  }
  duplicated_template_id?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionModel {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  tier: 'free' | 'pro' | 'max'
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at?: string
  ended_at?: string
  trial_end?: string
  created_at: string
  updated_at: string
}

export interface TodoListModel {
  todo_list_id: string
  user_id: string
  notion_database_id: string
  created_at: string
  updated_at: string
}

export interface NotionDatabaseModel {
  notion_database_id: string
  metadata: {
    id: string
    title?: string
    description?: string
    icon?: {
      type: 'emoji' | 'external' | 'file'
      emoji?: string
      external?: { url: string }
      file?: { url: string }
    }
    cover?: {
      type: 'external' | 'file'
      external?: { url: string }
      file?: { url: string }
    }
    parent?: {
      type: string
      workspace?: boolean
      page_id?: string
    }
    properties?: Record<string, any>
    url?: string
  }
  created_at: string
  updated_at: string
}

// Notion API types
export interface NotionBlock {
  id: string
  type: string
  has_children: boolean
  archived: boolean
  created_time: string
  last_edited_time: string
  created_by: {
    id: string
    object: string
  }
  last_edited_by: {
    id: string
    object: string
  }
  parent: {
    type: string
    page_id?: string
    database_id?: string
    block_id?: string
  }
  to_do?: {
    rich_text: NotionRichText[]
    checked: boolean
    color: string
  }
  paragraph?: {
    rich_text: NotionRichText[]
    color: string
  }
  bulleted_list_item?: {
    rich_text: NotionRichText[]
    color: string
  }
  numbered_list_item?: {
    rich_text: NotionRichText[]
    color: string
  }
}

export interface NotionRichText {
  type: 'text' | 'mention' | 'equation'
  text?: {
    content: string
    link?: {
      url: string
    }
  }
  mention?: {
    type: string
    [key: string]: any
  }
  equation?: {
    expression: string
  }
  annotations?: {
    bold: boolean
    italic: boolean
    strikethrough: boolean
    underline: boolean
    code: boolean
    color: string
  }
  plain_text: string
  href?: string
}

export interface NotionPage {
  id: string
  created_time: string
  last_edited_time: string
  created_by: {
    id: string
    object: string
  }
  last_edited_by: {
    id: string
    object: string
  }
  cover?: {
    type: string
    external?: { url: string }
    file?: { url: string }
  }
  icon?: {
    type: 'emoji' | 'external' | 'file'
    emoji?: string
    external?: { url: string }
    file?: { url: string }
  }
  parent: {
    type: string
    database_id?: string
    page_id?: string
    workspace?: boolean
  }
  archived: boolean
  properties: Record<string, any>
  url: string
}

// Stripe types
export interface StripeCustomer {
  id: string
  email?: string
  metadata: {
    supabase_user_id?: string
    [key: string]: any
  }
}

export interface StripeSubscription {
  id: string
  customer: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at?: number
  ended_at?: number
  trial_end?: number
  items: {
    data: Array<{
      price: {
        id: string
        product: string
        unit_amount: number
        currency: string
      }
    }>
  }
}

// Tier configuration
export interface TierConfig {
  name: string
  price: number
  priceId: string
  limits: {
    notionDatabases: number
    todosPerDatabase: number
    refreshInterval: number
  }
  features: string[]
}
