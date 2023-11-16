import { createClient } from '@supabase/supabase-js';
import { Client, isFullBlock } from '@notionhq/client';
import {
  PageObjectResponse,
  BlockObjectResponse,
  PartialPageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { consola } from 'consola';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const notion = new Client({ auth: process.env.NOTION_API_KEY });

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
    page_size: 5
  });

  const pages = databasePages.results || [];

  consola.log('PAGES', JSON.stringify(pages, null, 2));

  const pageToBeInserted: any[] = [];

  const pagesWithBlocks = await Promise.all(
    pages.map(async (pageBlock) => {
      if (pageBlock.object === 'page') {
        const page = pageBlock as PageObjectResponse;

        // @ts-ignore
        const block = await getPageBlocks(page);
        const title = getPageTitle(page);
        const parent_type = page.parent.type;
        // @ts-ignore
        const parent_id = page.parent[parent_type];

        pageToBeInserted.push({
          notion_block: block,
          block_text: title,
          notion_block_id: page.id,
          notion_parent_id: parent_id,
          notion_parent_type: parent_type,
          notion_created_time: page.created_time
        });

        return block;
      }
    })
  );

  const { error } = await supabase.from('page').insert(pageToBeInserted);

  if (error) {
    consola.error(error);
    throw error;
  }

  return pagesWithBlocks;
});

type BlockObjectResponseWithChildren = BlockObjectResponse & {
  children?: BlockObjectResponseWithChildren[];
};

export async function getPageBlocks(pageBlock: BlockObjectResponse) {
  const childrenBlocksResp = await notion.blocks.children.list({
    block_id: pageBlock.id
  });

  let children = [];

  for (const block of childrenBlocksResp.results) {
    if (isFullBlock(block)) {
      // Recursively get children blocks
      if (block.has_children) {
        await getPageBlocks(block);
      }

      const type = block.type;
      // @ts-ignore
      const text_items = block[type].rich_text;

      if (!text_items) {
        return;
      }

      if (block.type === 'to_do') {
        const parent_type = block.parent.type;
        // @ts-ignore
        const parent_id = block.parent[parent_type];

        const full_line = text_items
          .map((text_item: { plain_text: string }) => {
            return text_item.plain_text;
          })
          .join(' ');

        children.push({
          notion_block: block,
          block_text: full_line,
          notion_block_id: block.id,
          notion_page_id: pageBlock.id,
          notion_parent_id: parent_id,
          notion_parent_type: parent_type,
          checked: block.to_do.checked
        });
      }
    }
  }

  // consola.log('CHILDREN BLOCKS', JSON.stringify(children, null, 2));

  const { error } = await supabase.from('todo').insert(children);

  if (error) {
    consola.error(error);
    throw error;
  }

  return {
    message: 'todos inserted'
  };
}

function getPageTitle(page: PageObjectResponse) {
  // use the object keys method to find the title property.
  const titleProperty = Object.keys(page?.properties).find(
    (key) => page.properties[key].type === 'title'
  );

  return titleProperty
    ? // @ts-ignore
      page.properties[titleProperty].title[0].plain_text
    : '';
}
