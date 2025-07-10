import { createClient } from '@supabase/supabase-js';
import { serverSupabaseUser } from '#supabase/server';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  // const body = await readBody(event);
  const user = await serverSupabaseUser(event);

  // console.log(body, user);
  const { data, error } = await supabase
    .from('notion_access_token_user')
    .select()
    .eq('user_id', user?.id);

  if (error) {
    console.log(error);
    return error;
  }

  if (data.length > 0 && data[0].access_token) {
    return {
      is_auth: true,
      user
    };
  }

  console.error('No access token found for user', user?.id);

  return {
    is_auth: false
  };
});
