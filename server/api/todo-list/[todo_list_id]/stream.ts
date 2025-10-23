import { Client, isFullBlock } from '@notionhq/client';
import type {
  ToDoBlockObjectResponse,
  PageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';
import { consola } from 'consola';
import {
  fetchAllDatabasePages,
  fetchAllChildBlocks
} from '~/server/utils/notion-pagination';
import { TIER_LIMITS, type TierName } from '~/lib/pricing';
import { getUserTier } from '~/server/utils/get-user-tier';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

type CheckboxBlock = ToDoBlockObjectResponse & {};

interface StreamChunk {
  type: 'progress' | 'data' | 'metadata' | 'complete' | 'error';
  payload?: any;
}

/**
 * Streaming endpoint that progressively returns todo list data
 * Uses Server-Sent Events (SSE) for real-time streaming
 */
export default defineEventHandler(async (event) => {
  const todoListId = getRouterParam(event, 'todo_list_id');

  if (!todoListId) {
    throw new Error('No todo_list_id found');
  }

  // Get user context
  const user = event.context.user;

  // Fetch user's subscription tier
  let userTier: TierName = 'free';
  let tierSource: string = 'default';

  if (user?.id) {
    const tierResult = await getUserTier(user.id);
    userTier = tierResult.tier;
    tierSource = tierResult.source;
    consola.info(`Stream: Using ${userTier} tier from ${tierSource} for user ${user.id}`);
  } else {
    consola.warn('Stream: No user context available, defaulting to free tier');
  }

  // Allow tier override for testing
  const testTier = getQuery(event).tier as string;
  if (testTier && ['free', 'pro', 'max'].includes(testTier)) {
    consola.info(`Stream: Overriding tier to ${testTier} for testing`);
    userTier = testTier as TierName;
    tierSource = 'test-override';
  }

  const tierLimits = TIER_LIMITS[userTier];

  // Fetch todo list metadata
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

  // Set up SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Create a stream
  const stream = createEventStream(event);

  // Helper to send SSE messages
  const sendChunk = (chunk: StreamChunk) => {
    stream.push(`data: ${JSON.stringify(chunk)}\n\n`);
  };

  try {
    // Track extraction metadata
    const extractionErrors: string[] = [];
    let totalCheckboxes = 0;
    let processedPages = 0;

    // Fetch all pages first
    const { pages, totalPages, wasLimited: pagesLimited } = await fetchAllDatabasePages(
      notion,
      notionDatabaseId,
      tierLimits.maxPages
    );

    consola.info(`Stream: Fetched ${totalPages} pages from database`);

    // Send initial progress
    sendChunk({
      type: 'progress',
      payload: {
        totalPages,
        processedPages: 0,
        totalCheckboxes: 0
      }
    });

    // Process pages in batches and stream results
    const STREAM_BATCH_SIZE = 10; // Send data every 10 pages

    for (let i = 0; i < pages.length; i += STREAM_BATCH_SIZE) {
      const batch = pages.slice(i, i + STREAM_BATCH_SIZE);
      const batchResults: Array<{
        page: PageObjectResponse;
        checkboxes: CheckboxBlock[];
        metadata: {
          totalBlocks: number;
          wasLimited: boolean;
        };
      }> = [];

      // Process batch in parallel
      await Promise.all(
        batch.map(async (pageBlock) => {
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

            if (checkboxBlocks.length > 0) {
              batchResults.push({
                page: pageBlock,
                checkboxes: checkboxBlocks,
                metadata: {
                  totalBlocks,
                  wasLimited: blocksLimited
                }
              });
            }
          } catch (error) {
            const errorMsg = `Failed to fetch blocks for page ${pageBlock.id}: ${error}`;
            consola.error(errorMsg);
            extractionErrors.push(errorMsg);
          }
        })
      );

      processedPages += batch.length;

      // Send batch data
      if (batchResults.length > 0) {
        sendChunk({
          type: 'data',
          payload: {
            pages: batchResults
          }
        });
      }

      // Send progress update
      sendChunk({
        type: 'progress',
        payload: {
          totalPages,
          processedPages,
          totalCheckboxes,
          percentComplete: Math.round((processedPages / totalPages) * 100)
        }
      });

      // Small delay between batches to prevent overwhelming the client
      if (i + STREAM_BATCH_SIZE < pages.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Prepare final metadata
    const extractionMetadata = {
      totalPages,
      totalCheckboxes,
      pagesWithCheckboxes: processedPages,
      extractionComplete: !pagesLimited && extractionErrors.length === 0,
      errors: extractionErrors,
      limits: {
        tier: userTier,
        tierSource,
        maxPages: tierLimits.maxPages,
        maxCheckboxesPerPage: tierLimits.maxCheckboxesPerPage,
        pagesLimited,
        reachedPageLimit: pagesLimited && tierLimits.maxPages ? totalPages >= tierLimits.maxPages : false
      }
    };

    // Update the todo_list with extraction metadata
    await supabase
      .from('todo_list')
      .update({
        extraction_metadata: extractionMetadata
      })
      .eq('todo_list_id', todoListId);

    // Send metadata and sync info
    sendChunk({
      type: 'metadata',
      payload: {
        syncInfo: {
          syncDatabaseId: data[0].notion_sync_database_id,
          lastSyncDate: data[0].last_sync_date
        },
        metadata: extractionMetadata
      }
    });

    // Send completion signal
    sendChunk({
      type: 'complete',
      payload: {
        totalPages,
        totalCheckboxes
      }
    });

    consola.info(`Stream: Completed streaming ${totalPages} pages with ${totalCheckboxes} checkboxes`);
  } catch (error) {
    consola.error('Stream: Failed to fetch todo list:', error);

    sendChunk({
      type: 'error',
      payload: {
        message: `Failed to fetch todo list: ${error}`
      }
    });
  } finally {
    // Close the stream
    await stream.close();
  }
});
