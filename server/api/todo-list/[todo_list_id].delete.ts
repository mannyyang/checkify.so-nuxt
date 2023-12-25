import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  const { user } = event.context;
  const todo_list_id = getRouterParam(event, 'todo_list_id');

  if (!todo_list_id) {
    throw 'Error: no todo_list_id found';
  }

  if (!user) {
    throw 'Error: no user found';
  }

  console.log('TODO_LIST_DELETE', todo_list_id);

  const { error } = await supabase
    .from('todo_list')
    .delete()
    .eq('todo_list_id', todo_list_id);

  if (error) {
    console.log(error);
    return error;
  }

  return {
    success: true
  };
});
