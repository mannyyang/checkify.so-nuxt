import { Client, isFullBlock } from '@notionhq/client';
import type {
  ToDoBlockObjectResponse,
  PageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';
import { consola } from 'consola';
import {
  fetchAllDatabasePages,
  fetchAllChildBlocks,
  processPagesInBatches
} from '~/server/utils/notion-pagination';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

type CheckboxBlock = ToDoBlockObjectResponse & {};

// Define tier limits
const TIER_LIMITS = {
  free: {
    maxPages: 10,
    maxCheckboxesPerPage: 50
  },
  pro: {
    maxPages: 100,
    maxCheckboxesPerPage: 200
  },
  enterprise: {
    maxPages: undefined, // unlimited
    maxCheckboxesPerPage: undefined // unlimited
  }
};

export default defineEventHandler(async (event) => {
  const todoListId = getRouterParam(event, 'todo_list_id');

  if (!todoListId) {
    throw new Error('No todo_list_id found');
  }

  // Get user context (this would include subscription data)
  const user = event.context.user;

  // TODO: Fetch subscription tier from database based on user.id
  // For now, check query parameter for testing (remove in production)
  const testTier = getQuery(event).tier as string;
  const userTier = testTier && ['free', 'pro', 'enterprise'].includes(testTier)
    ? testTier
    : 'free'; // Default to free tier

  const tierLimits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS];

  const { data, error } = await supabase
    .from('todo_list')
    .select(`
      notion_database_id(notion_database_id, access_token),
      notion_sync_database_id,
      last_sync_date
    `)
    .eq('todo_list_id', todoListId);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No todo list found');
  }

  const {
    // @ts-ignore
    notion_database_id: { notion_database_id: notionDatabaseId, access_token: accessToken }
  } = data[0];

  const notion = new Client({ auth: accessToken });

  // Track extraction metadata
  const extractionErrors: string[] = [];
  let totalCheckboxes = 0;

  try {
    // Fetch pages with tier-based limit
    const { pages, totalPages, wasLimited: pagesLimited } = await fetchAllDatabasePages(
      notion,
      notionDatabaseId,
      tierLimits.maxPages
    );

    consola.info(`Fetched ${totalPages} pages from database`);

    // Process pages in batches to get checkboxes
    const pagesWithBlocks = await processPagesInBatches(
      pages,
      5, // Process 5 pages at a time
      async (pageBlock) => {
        try {
          // Fetch child blocks with tier-based limit
          const { blocks, totalBlocks, wasLimited: blocksLimited } = await fetchAllChildBlocks(
            notion,
            pageBlock.id,
            tierLimits.maxCheckboxesPerPage
          );

          // Filter for checkbox blocks
          const checkboxBlocks = blocks.filter((childBlock) => {
            if (isFullBlock(childBlock)) {
              return childBlock.type === 'to_do';
            }
            return false;
          }) as CheckboxBlock[];

          totalCheckboxes += checkboxBlocks.length;

          return {
            page: pageBlock,
            checkboxes: checkboxBlocks,
            metadata: {
              totalBlocks,
              wasLimited: blocksLimited
            }
          };
        } catch (error) {
          const errorMsg = `Failed to fetch blocks for page ${pageBlock.id}: ${error}`;
          consola.error(errorMsg);
          extractionErrors.push(errorMsg);

          // Return page with empty checkboxes on error
          return {
            page: pageBlock,
            checkboxes: [],
            metadata: {
              totalBlocks: 0,
              wasLimited: false,
              error: errorMsg
            }
          };
        }
      }
    );

    // Filter out pages without checkboxes
    const pagesWithCheckboxes = pagesWithBlocks.filter((block) => {
      return block.checkboxes.length > 0;
    });

    return {
      pages: pagesWithCheckboxes,
      syncInfo: {
        syncDatabaseId: data[0].notion_sync_database_id,
        lastSyncDate: data[0].last_sync_date
      },
      metadata: {
        totalPages,
        totalCheckboxes,
        pagesWithCheckboxes: pagesWithCheckboxes.length,
        extractionComplete: !pagesLimited && extractionErrors.length === 0,
        errors: extractionErrors,
        limits: {
          tier: userTier,
          maxPages: tierLimits.maxPages,
          maxCheckboxesPerPage: tierLimits.maxCheckboxesPerPage,
          pagesLimited,
          reachedPageLimit: pagesLimited && tierLimits.maxPages ? totalPages >= tierLimits.maxPages : false
        }
      }
    };
  } catch (error) {
    consola.error('Failed to fetch todo list:', error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch todo list: ${error}`
    });
  }
});
