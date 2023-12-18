import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  const { user, notion_auth } = event.context;
  const body: DatabaseObjectResponse = await readBody(event);

  if (!body || !notion_auth) {
    throw 'Error: no body or auth found';
  }

  console.log('TODO_LIST_DELETE', body);

  const { error } = await supabase
    .from('todo_list')
    .delete()
    .eq('todo_list_id', body.id);

  if (error) {
    console.log(error);
    return error;
  }

  return body;
});
