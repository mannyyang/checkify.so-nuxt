import { getSupabaseAdmin } from '~/server/utils/supabase';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  // Redirect on home
  const urlObj = getRequestURL(event);
  // don't touch error routes
  if (urlObj.pathname === '/__nuxt_error') { return; }
  // redirects /old-page -> /new-page
  // if (urlObj.pathname == '/') {
  //   return await sendRedirect(event, '/my-todo-lists');
  // }

  const supabase = getSupabaseAdmin();

  // TODO: build error happens with auth. catch so it doesn't fail at least
  // https://github.com/nuxt-modules/supabase/issues/238
  try {
    const user = await serverSupabaseUser(event);

    event.context.user = user || undefined;

    const { data, error } = await supabase
      .from('notion_access_token_user')
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
