import { Client, isFullBlock } from '@notionhq/client';
import {
  ToDoBlockObjectResponse,
  PageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { consola } from 'consola';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

type CheckboxBlock = ToDoBlockObjectResponse & {};

export default defineEventHandler(async () => {
  const databaseId = '5d619652040e4c9788e6cf0bd7aa6ed5';

  const databasePages = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: 'Created time',
        direction: 'descending'
      }
    ],
    page_size: 60
  });

  const pages = databasePages.results || [];

  const pagesWithBlocks = await Promise.all(
    pages.map(async (pageBlock) => {
      const childrenBlocksResp = await notion.blocks.children.list({
        block_id: pageBlock.id
      });

      consola.log('PAGE', pageBlock);

      const checkboxBlocks = childrenBlocksResp.results.filter((childBlock) => {
        if (isFullBlock(childBlock)) {
          return childBlock.type === 'to_do';
        }
      }) as CheckboxBlock[];

      consola.log('CHECKBOXES', checkboxBlocks);

      const item = {
        page: pageBlock as PageObjectResponse,
        checkboxes: checkboxBlocks
      };

      return item;
    })
  );

  const pagesWithCheckboxes = pagesWithBlocks.filter((block) => {
    return block.checkboxes.length > 0;
  });

  return pagesWithCheckboxes;
});
