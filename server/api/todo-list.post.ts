import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  const body: DatabaseObjectResponse = await readBody(event);

  if (body) {
    console.log('TODO_LIST_POST', body);

    const { error } = await supabase.from('notion_database').upsert({
      notion_database_id: body.id,
      // @ts-ignore
      name: body.name,
      metadata: body
    });

    if (error) {
      console.log(error);
      return error;
    }

    const { error: todo_list_error } = await supabase
      .from('notion_database')
      .upsert({
        notion_database_id: body.id,
        // @ts-ignore
        name: body.name,
        metadata: body
      });

    if (todo_list_error) {
      console.log(todo_list_error);
      return todo_list_error;
    }

    return body;
  }

  throw "Error: no body found";
});
