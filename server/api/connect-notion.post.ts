import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (body) {
    console.log('INSIDE', body);

    const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
    const redirectUri = 'http://localhost:3000/connect-notion';

    console.log(clientId, clientSecret)

    // encode in base 64
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    );

    const response = await $fetch('https://api.notion.com/v1/oauth/token', {
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
    });

    const payload = {
      // @ts-ignore
      ...response,
      user_id: body.user_id
    };
    const { error } = await supabase
      .from('notion_access_token')
      .upsert(payload);

    if (error) {
      console.log(error);
      return error;
    }

    return payload;
  }

  return {
    error: 'error'
  };
});
