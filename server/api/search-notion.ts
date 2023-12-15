import { createClient } from '@supabase/supabase-js';
import { Client, isFullBlock } from '@notionhq/client';
import { c } from 'vitest/dist/reporters-5f784f42';
// import {
//   ToDoBlockObjectResponse,
//   PageObjectResponse
// } from '@notionhq/client/build/src/api-endpoints';

// const supabase = createClient(
//   process.env.SUPABASE_URL || '',
//   process.env.SUPABASE_SERVICE_KEY || ''
// );

export default defineEventHandler(async (event) => {
  // get query parameters from nuxt3 server
  const { query = '' } = getQuery(event);

  const accessToken = event.context.notion_auth.access_token;
  const notion = new Client({ auth: accessToken });

  const response = await notion.search({
    // @ts-ignore
    query: query,
    filter: {
      value: 'database',
      property: 'object'
    },
    sort: {
      direction: 'ascending',
      timestamp: 'last_edited_time'
    }
  });

  console.log(response);

  return {
    databases: response.results.map((result) => {
      // @ts-ignore
      return { ...result, name: result.title[0].plain_text };
    })
  };
});
