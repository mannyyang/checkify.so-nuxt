import {
  serverSupabaseServiceRole,
  serverSupabaseUser
} from '#supabase/server';

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event);

  try {
    const user = await serverSupabaseUser(event);

    event.context.user = user;

    const { data, error } = await supabase
      .from('notion_access_token')
      .select()
      .eq('user_id', user?.id || '');

    if (error) {
      throw new Error(error.message);
    }

    if (data.length > 0 && data[0].access_token) {
      event.context.notion_auth = data[0];
    }
  } catch (err) {
    console.log(err);
  }
});
