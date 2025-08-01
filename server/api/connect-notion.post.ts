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

    let response: any;
    try {
      response = await $fetch('https://api.notion.com/v1/oauth/token', {
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
    } catch (error: any) {
      console.error('Notion OAuth error:', error.data || error.message);
      console.error('Request details:', {
        code: body.code,
        redirectUri,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });
      throw error;
    }

    console.log('OAUTH_RESPONSE', response);

    // First, store in the notion_access_token table
    // Based on the CSV data, this table has individual columns for each field
    // Use upsert to handle reconnections to the same workspace
    const { error: tokenError } = await supabase
      .from('notion_access_token')
      .upsert({
        bot_id: response.bot_id,
        access_token: response.access_token,
        token_type: response.token_type,
        workspace_name: response.workspace_name,
        workspace_icon: response.workspace_icon,
        workspace_id: response.workspace_id,
        request_id: response.request_id,
        owner: response.owner,
        duplicated_template_id: response.duplicated_template_id
      }, {
        onConflict: 'access_token'
      });

    if (tokenError) {
      throw tokenError;
    }

    // Then, store the user's access token
    // First, delete any existing record for this user
    await supabase
      .from('notion_access_token_user')
      .delete()
      .eq('user_id', body.user_id);

    // Then insert the new token
    const { error: userTokenError } = await supabase
      .from('notion_access_token_user')
      .insert({
        user_id: body.user_id,
        access_token: response.access_token
      });

    if (userTokenError) {
      throw userTokenError;
    }

    return {
      success: true,
      workspace_name: response.workspace_name,
      workspace_id: response.workspace_id
    };
  }

  return {
    error: 'error'
  };
});
