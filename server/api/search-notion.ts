import { createClient } from '@supabase/supabase-js';
import { Client, isFullBlock } from '@notionhq/client';
// import {
//   ToDoBlockObjectResponse,
//   PageObjectResponse
// } from '@notionhq/client/build/src/api-endpoints';

// const supabase = createClient(
//   process.env.SUPABASE_URL || '',
//   process.env.SUPABASE_SERVICE_KEY || ''
// );

export default defineEventHandler(async (event) => {
  const accessToken = event.context.notion_auth.access_token;
  const notion = new Client({ auth: accessToken });

  const response = await notion.search({
    query: 'Daily',
    filter: {
      value: 'database',
      property: 'object'
    },
    sort: {
      direction: 'ascending',
      timestamp: 'last_edited_time'
    }
  });

  return {
    response
  };
});
