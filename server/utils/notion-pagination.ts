import type { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  BlockObjectResponse,
  QueryDatabaseResponse,
  ListBlockChildrenResponse
} from '@notionhq/client/build/src/api-endpoints';
import { consola } from 'consola';

export const EXTRACTION_CONFIG = {
  maxPagesPerRequest: 100, // Notion API limit
  maxBlocksPerRequest: 100, // Notion API limit
  maxConcurrentRequests: 5, // Prevent rate limiting
  requestDelayMs: 100 // Add delay between requests
};

/**
 * Fetch all pages from a Notion database with pagination
 */
export async function fetchAllDatabasePages (
  notion: Client,
  databaseId: string,
  maxPages?: number
): Promise<{
  pages: PageObjectResponse[];
  totalPages: number;
  wasLimited: boolean;
}> {
  const allPages: PageObjectResponse[] = [];
  let hasMore = true;
  let startCursor: string | undefined;
  let wasLimited = false;

  try {
    while (hasMore) {
      // Check if we've reached the max pages limit
      if (maxPages && allPages.length >= maxPages) {
        wasLimited = true;
        break;
      }

      const response: QueryDatabaseResponse = await notion.databases.query({
        database_id: databaseId,
        page_size: Math.min(
          EXTRACTION_CONFIG.maxPagesPerRequest,
          maxPages ? maxPages - allPages.length : EXTRACTION_CONFIG.maxPagesPerRequest
        ),
        start_cursor: startCursor,
        sorts: [
          {
            timestamp: 'last_edited_time',
            direction: 'descending'
          }
        ]
      });

      allPages.push(...(response.results as PageObjectResponse[]));
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;

      // Add delay to prevent rate limiting
      if (hasMore) {
        await delay(EXTRACTION_CONFIG.requestDelayMs);
      }
    }
  } catch (error) {
    consola.error('Error fetching database pages:', error);
    throw error;
  }

  return {
    pages: allPages,
    totalPages: allPages.length,
    wasLimited
  };
}

/**
 * Fetch all child blocks from a Notion page with pagination
 */
export async function fetchAllChildBlocks (
  notion: Client,
  blockId: string,
  maxBlocks?: number
): Promise<{
  blocks: BlockObjectResponse[];
  totalBlocks: number;
  wasLimited: boolean;
}> {
  const allBlocks: BlockObjectResponse[] = [];
  let hasMore = true;
  let startCursor: string | undefined;
  let wasLimited = false;

  try {
    while (hasMore) {
      // Check if we've reached the max blocks limit
      if (maxBlocks && allBlocks.length >= maxBlocks) {
        wasLimited = true;
        break;
      }

      const response: ListBlockChildrenResponse = await notion.blocks.children.list({
        block_id: blockId,
        page_size: Math.min(
          EXTRACTION_CONFIG.maxBlocksPerRequest,
          maxBlocks ? maxBlocks - allBlocks.length : EXTRACTION_CONFIG.maxBlocksPerRequest
        ),
        start_cursor: startCursor
      });

      allBlocks.push(...response.results.filter((block): block is BlockObjectResponse => 'type' in block));
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;

      // Add delay to prevent rate limiting
      if (hasMore) {
        await delay(EXTRACTION_CONFIG.requestDelayMs);
      }
    }
  } catch (error) {
    consola.error('Error fetching child blocks:', error);
    throw error;
  }

  return {
    blocks: allBlocks,
    totalBlocks: allBlocks.length,
    wasLimited
  };
}

/**
 * Process pages in batches to avoid memory issues and rate limits
 */
export async function processPagesInBatches<T> (
  pages: PageObjectResponse[],
  batchSize: number,
  processor: (page: PageObjectResponse) => Promise<T>
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(page => processor(page))
    );
    results.push(...batchResults);

    // Add delay between batches
    if (i + batchSize < pages.length) {
      await delay(EXTRACTION_CONFIG.requestDelayMs * 2);
    }
  }

  return results;
}

/**
 * Utility function to add delay
 */
function delay (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
