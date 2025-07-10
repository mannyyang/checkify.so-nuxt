import { Client } from '@notionhq/client';

export default defineEventHandler(async (event) => {
  // get query parameters from nuxt3 server
  const { query = '' } = getQuery(event);
  const { user, notion_auth } = event.context;

  if (notion_auth) {
    console.log('SEARCH_NOTION', query);

    const accessToken = notion_auth.access_token;
    const notion = new Client({ auth: accessToken });

    const response = await notion.search({
      // @ts-ignore
      query,
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
      databases: response.results.map((result) => {
        // @ts-ignore
        return { ...result, name: result.title[0].plain_text };
      })
    };
  }

  throw 'Error: no auth found';
});
