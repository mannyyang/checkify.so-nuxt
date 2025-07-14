import crypto from 'crypto';
import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';
import { consola } from 'consola';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Notion webhook payload types
interface NotionWebhookVerification {
  verification_token: string;
}

interface NotionWebhookEvent {
  id: string;
  type: string;
  event_time: string;
  workspace_id: string;
  entity: {
    id: string;
    type: string;
  };
  author?: {
    user_id: string;
  };
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Handle webhook verification
  if (body.verification_token) {
    consola.info('Webhook verification request received');

    // Store the verification token for future validation
    // For now, we'll just respond to verify the webhook
    return {
      verified: true,
      verification_token: body.verification_token
    };
  }

  // Handle actual webhook events
  const webhookEvent = body as NotionWebhookEvent;
  consola.info('Received Notion webhook event:', {
    type: webhookEvent.type,
    entityId: webhookEvent.entity.id,
    entityType: webhookEvent.entity.type
  });

  // We're interested in page update events
  if (
    webhookEvent.type === 'page.updated' &&
    webhookEvent.entity.type === 'page'
  ) {
    try {
      // First, find which sync database this page belongs to
      const { data: syncPageData, error: syncPageError } = await supabase
        .from('notion_sync_pages')
        .select('sync_database_id, block_id, todo_list_id')
        .eq('page_id', webhookEvent.entity.id)
        .single();

      if (syncPageError || !syncPageData) {
        // This page might not be from a synced database
        consola.warn(
          'Page not found in sync tracking:',
          webhookEvent.entity.id
        );
        return { success: true, message: 'Page not tracked' };
      }

      // Get the todo list and access token
      const { data: todoListData, error: todoListError } = await supabase
        .from('todo_list')
        .select(
          `
          todo_list_id,
          notion_database_id(access_token)
        `
        )
        .eq('todo_list_id', syncPageData.todo_list_id)
        .single();

      if (todoListError || !todoListData) {
        throw new Error('Could not find todo list for this sync page');
      }

      // @ts-ignore
      const accessToken = todoListData.notion_database_id.access_token;
      const notion = new Client({ auth: accessToken });

      // Fetch the updated page to get its current state
      const pageResponse = await notion.pages.retrieve({
        page_id: webhookEvent.entity.id
      });

      // @ts-ignore
      const isChecked = pageResponse.properties.Status?.checkbox;
      const blockId = syncPageData.block_id;

      // Update the original checkbox block
      await notion.blocks.update({
        block_id: blockId,
        to_do: {
          checked: isChecked
        }
      });

      consola.success(
        `Updated checkbox block ${blockId} to checked=${isChecked}`
      );

      return {
        success: true,
        updated: {
          blockId,
          checked: isChecked,
          pageId: webhookEvent.entity.id
        }
      };
    } catch (error: any) {
      consola.error('Webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // For other event types, just acknowledge receipt
  return {
    success: true,
    message: `Received ${webhookEvent.type} event`
  };
});
