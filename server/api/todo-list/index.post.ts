import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  const { user, notion_auth } = event.context;
  const body: DatabaseObjectResponse = await readBody(event);

  if (body && notion_auth) {
    console.log('TODO_LIST_POST', body);

    const { error } = await supabase.from('notion_database').upsert({
      notion_database_id: body.id,
      // @ts-ignore
      name: body.name,
      metadata: body,
      access_token: notion_auth.access_token
    });

    if (error) {
      console.log(error);
      return error;
    }

    const { error: todo_list_error } = await supabase.from('todo_list').upsert({
      user_id: user.id,
      notion_database_id: body.id
    });

    if (todo_list_error) {
      console.log(todo_list_error);
      return todo_list_error;
    }

    return body;
  }

  throw 'Error: no body or auth found';
});
