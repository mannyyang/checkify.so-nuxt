import { createClient } from '@supabase/supabase-js';
import { Client, isFullBlock } from '@notionhq/client';
import {
  PageObjectResponse,
  BlockObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { consola } from 'consola';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default defineEventHandler(async () => {
  const databaseId = '354fc77fed494e9d8db90fd4d50d80fe';

  const databasePages = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: 'Created time',
        direction: 'descending'
      }
    ],
    page_size: 1
  });

  const pages = databasePages.results || [];

  const pagesWithBlocks = await Promise.all(
    pages.map(async (pageBlock) => {
      // @ts-ignore
      const block = await getPageBlocks(pageBlock);

      return block;
    })
  );

  return pagesWithBlocks;
});

type BlockObjectResponseWithChildren = BlockObjectResponse & {
  children?: BlockObjectResponseWithChildren[];
};

export async function getPageBlocks(pageBlock: BlockObjectResponse) {
  const childrenBlocksResp = await notion.blocks.children.list({
    block_id: pageBlock.id
  });

  childrenBlocksResp.results.forEach(
    async (block: any & BlockObjectResponseWithChildren) => {
      if (isFullBlock(block)) {
        const type = block.type;
        // @ts-ignore
        const text_items = block[type].rich_text;

        // Recursively get children blocks
        if (block.has_children) {
          const children = await getPageBlocks(block);
          // @ts-ignore
          block.children = children;
        }

        if (!text_items) {
          return;
        }

        consola.log('BLOCK', block);

        const full_line = text_items
          .map((text_item: { plain_text: string }) => {
            return text_item.plain_text;
          })
          .join(' ');

        // Extract tags from text_items
        const tags = text_items.filter((text_item: { plain_text: string }) => {
          return text_item.plain_text && text_item.plain_text.includes('#');
        });

        tags.forEach(async (tag: { plain_text: string }) => {
          const strTags = tag.plain_text
            .split(' ')
            .filter((v) => v.startsWith('#'));

          for (const strTag of strTags) {
            const { data, error } = await supabase.from('tag').insert({
              name: strTag,
              notion_block: block,
              line_text: full_line
            });

            if (data) {
              consola.log(data);
            }

            if (error) {
              consola.error(error);
            }
          }
        });
      }
    }
  );

  // @ts-ignore
  pageBlock.children = childrenBlocksResp.results;

  return pageBlock;
}
