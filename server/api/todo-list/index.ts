import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  const { user, notion_auth } = event.context;

  if (!user?.id || !notion_auth) {
    throw 'Error: no user or notion_auth found';
  }

  const { data, error } = await supabase
    .from('todo_list')
    .select('todo_list_id, created_at, notion_database_id(metadata)')
    .eq('user_id', user!.id);

  if (error) {
    console.log(error);
    return error;
  }

  return {
    todo_lists: data
  };
});
