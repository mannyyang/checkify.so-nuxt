// Re-export all types for easy importing
export * from './api';
export * from './models';

// Add any global type augmentations here
declare module '#app' {
  interface NuxtApp {
    $supabase: import('@supabase/supabase-js').SupabaseClient
  }
}

declare module 'h3' {
  interface H3EventContext {
    user?: import('@supabase/supabase-js').User
    notion_auth?: import('./models').NotionAuthModel
  }
}
