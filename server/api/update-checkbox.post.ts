import { Client, isFullBlock } from '@notionhq/client';
import {
  ToDoBlockObjectResponse,
  PageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { consola } from 'consola';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

type CheckboxBlock = ToDoBlockObjectResponse & {};

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const databaseId = '5d619652040e4c9788e6cf0bd7aa6ed5';

  const databasePages = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: 'Created time',
        direction: 'descending'
      }
    ],
    page_size: 100
  });


});
