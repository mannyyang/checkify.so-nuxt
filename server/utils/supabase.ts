import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { H3Event } from 'h3';
import { sendError, ErrorCodes } from './api-response';

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseAdmin (): SupabaseClient {
  if (!adminClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return adminClient;
}

export function getSupabaseAnon (): SupabaseClient {
  if (!anonClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    anonClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return anonClient;
}

export async function getSupabaseUser (event: H3Event) {
  const user = event.context.user;

  if (!user?.id) {
    sendError(event, ErrorCodes.UNAUTHORIZED, 'User not authenticated', 401);
  }

  return user;
}

export async function requireNotionAuth (event: H3Event) {
  const notionAuth = event.context.notion_auth;

  if (!notionAuth) {
    sendError(
      event,
      ErrorCodes.UNAUTHORIZED,
      'Notion authentication required. Please connect your Notion account.',
      401
    );
  }

  return notionAuth;
}

export async function withSupabaseError<T> (
  event: H3Event,
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await operation();

  if (error) {
    console.error('[Supabase Error]', error);
    sendError(
      event,
      ErrorCodes.SUPABASE_ERROR,
      error.message || 'Database operation failed',
      error.status || 500,
      { code: error.code }
    );
  }

  if (!data) {
    sendError(event, ErrorCodes.NOT_FOUND, 'Resource not found', 404);
  }

  return data;
}
