import { Client } from '@notionhq/client';
import type {
  ToDoBlockObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';
import { consola } from 'consola';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  consola.info('=== SET CHECKBOX REQUEST RECEIVED ===');

  const body = await readBody(event);
  consola.info('Request body:', JSON.stringify(body, null, 2));

  const { checkbox, todo_list_id } = body as {
    checkbox: ToDoBlockObjectResponse;
    todo_list_id: string;
  };

  consola.info('Parsed - todo_list_id:', todo_list_id);
  consola.info('Parsed - checkbox.id:', checkbox?.id);
  consola.info('Parsed - checkbox.to_do.checked:', checkbox?.to_do?.checked);

  if (!todo_list_id) {
    consola.error('Missing todo_list_id');
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing todo_list_id'
    });
  }

  if (!checkbox?.id) {
    consola.error('Missing checkbox data');
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing checkbox data'
    });
  }

  try {
    // Fetch the access token for this todo list's database
    consola.info('Querying database for todo_list_id:', todo_list_id);
    const { data, error } = await supabase
      .from('todo_list')
      .select(`
        notion_database_id(notion_database_id, access_token)
      `)
      .eq('todo_list_id', todo_list_id)
      .single();

    if (error || !data) {
      consola.error('Failed to fetch todo list:', error);
      throw createError({
        statusCode: 404,
        statusMessage: 'Todo list not found'
      });
    }

    consola.info('Database query result:', JSON.stringify(data, null, 2));

    // @ts-ignore - Supabase types for nested relations
    const { access_token: accessToken } = data.notion_database_id;

    if (!accessToken) {
      consola.error('No access token found in database result');
      throw createError({
        statusCode: 401,
        statusMessage: 'No access token found for this database'
      });
    }

    consola.info('Access token found, length:', accessToken.length);

    // Create Notion client with user's OAuth access token
    const notion = new Client({ auth: accessToken });

    consola.info('Calling Notion API to update block:', checkbox.id, 'to checked:', checkbox.to_do.checked);

    // Update the block in Notion
    const response = await notion.blocks.update({
      block_id: checkbox.id,
      to_do: {
        checked: checkbox.to_do.checked
      }
    });

    consola.success(`✅ Successfully updated checkbox ${checkbox.id} to ${checkbox.to_do.checked}`);
    return response;
  } catch (error: any) {
    consola.error('Failed to update checkbox:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to update checkbox'
    });
  }
});
