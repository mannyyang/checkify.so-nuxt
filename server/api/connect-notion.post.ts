import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (body) {
    console.log('CONNECT_NOTION', body);

    const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.BASE_URL + '/connect-notion';

    // encode in base 64
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    );

    const response: { access_token: string } = await $fetch(
      'https://api.notion.com/v1/oauth/token',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          authorization: `Basic ${encoded}`
        },
        body: {
          grant_type: 'authorization_code',
          code: body.code,
          redirect_uri: redirectUri
        }
      }
    );

    console.log('OAUTH_RESPONSE', response);

    const { error: tokenError } = await supabase
      .from('notion_access_token')
      .upsert(response);

    if (tokenError) {
      throw tokenError;
    }

    const { error: userTokenError } = await supabase
      .from('notion_access_token_user')
      .upsert({
        user_id: body.user_id,
        access_token: response.access_token
      });

    if (userTokenError) {
      throw userTokenError;
    }

    return {
      connected: true
    };
  }

  return {
    error: 'error'
  };
});
