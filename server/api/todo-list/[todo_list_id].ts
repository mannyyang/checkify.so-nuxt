import { Client, isFullBlock } from '@notionhq/client';
import type {
  ToDoBlockObjectResponse,
  PageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';
import { consola } from 'consola';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

type CheckboxBlock = ToDoBlockObjectResponse & {};

export default defineEventHandler(async (event) => {
  const todo_list_id = getRouterParam(event, 'todo_list_id');

  if (!todo_list_id) {
    throw new Error('No todo_list_id found');
  }

  const { data, error } = await supabase
    .from('todo_list')
    .select('access_token, notion_database_id')
    .eq('todo_list_id', todo_list_id);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No todo list found');
  }

  const { access_token, notion_database_id } = data[0];

  const notion = new Client({ auth: access_token });

  const databasePages = await notion.databases.query({
    database_id: notion_database_id,
    page_size: 60
  });

  const pages = databasePages.results || [];

  const pagesWithBlocks = await Promise.all(
    pages.map(async (pageBlock) => {
      const childrenBlocksResp = await notion.blocks.children.list({
        block_id: pageBlock.id,
        page_size: 100
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
