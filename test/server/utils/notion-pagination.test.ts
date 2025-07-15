import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockPage,
  createMockTodoBlock,
  createMockParagraphBlock,
  createMockDatabaseQueryResponse,
  createMockBlockListResponse,
  createMockNotionClient
} from '../../mocks/notion-client';
import {
  fetchAllDatabasePages,
  fetchAllChildBlocks,
  processPagesInBatches,
  EXTRACTION_CONFIG
} from '~/server/utils/notion-pagination';

describe('notion-pagination utilities', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockNotionClient();
    vi.clearAllMocks();
  });

  describe('fetchAllDatabasePages', () => {
    it('should fetch a single page when has_more is false', async () => {
      const mockPages = [createMockPage('page-1', 'Page 1')];
      mockClient.databases.query.mockResolvedValueOnce(
        createMockDatabaseQueryResponse(mockPages, false)
      );

      const result = await fetchAllDatabasePages(mockClient as any, 'database-id');

      expect(result).toEqual({
        pages: mockPages,
        totalPages: 1,
        wasLimited: false
      });
      expect(mockClient.databases.query).toHaveBeenCalledTimes(1);
      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: 'database-id',
        page_size: EXTRACTION_CONFIG.maxPagesPerRequest,
        start_cursor: undefined
      });
    });

    it('should handle pagination when has_more is true', async () => {
      const pages1 = Array.from({ length: 100 }, (_, i) => createMockPage(`page-${i}`, `Page ${i}`));
      const pages2 = Array.from({ length: 50 }, (_, i) => createMockPage(`page-${i + 100}`, `Page ${i + 100}`));

      mockClient.databases.query
        .mockResolvedValueOnce(createMockDatabaseQueryResponse(pages1, true, 'cursor-1'))
        .mockResolvedValueOnce(createMockDatabaseQueryResponse(pages2, false));

      const result = await fetchAllDatabasePages(mockClient as any, 'database-id');

      expect(result).toEqual({
        pages: [...pages1, ...pages2],
        totalPages: 150,
        wasLimited: false
      });
      expect(mockClient.databases.query).toHaveBeenCalledTimes(2);
      expect(mockClient.databases.query).toHaveBeenNthCalledWith(2, {
        database_id: 'database-id',
        page_size: EXTRACTION_CONFIG.maxPagesPerRequest,
        start_cursor: 'cursor-1'
      });
    });

    it('should respect maxPages limit', async () => {
      const allPages = Array.from({ length: 100 }, (_, i) => createMockPage(`page-${i}`, `Page ${i}`));
      mockClient.databases.query.mockResolvedValueOnce(
        createMockDatabaseQueryResponse(allPages, true, 'cursor-1')
      );

      const result = await fetchAllDatabasePages(mockClient as any, 'database-id', 50);

      expect(result).toEqual({
        pages: allPages.slice(0, 50),
        totalPages: 50,
        wasLimited: true
      });
      expect(mockClient.databases.query).toHaveBeenCalledTimes(1);
      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: 'database-id',
        page_size: 50,
        start_cursor: undefined
      });
    });

    it('should handle errors gracefully', async () => {
      mockClient.databases.query.mockRejectedValueOnce(new Error('API Error'));

      await expect(fetchAllDatabasePages(mockClient as any, 'database-id'))
        .rejects.toThrow('API Error');
    });
  });

  describe('fetchAllChildBlocks', () => {
    it('should fetch all blocks from a page', async () => {
      const mockBlocks = [
        createMockTodoBlock('block-1', 'Todo 1', false),
        createMockTodoBlock('block-2', 'Todo 2', true),
        createMockParagraphBlock('block-3', 'Some text')
      ];
      mockClient.blocks.children.list.mockResolvedValueOnce(
        createMockBlockListResponse(mockBlocks, false)
      );

      const result = await fetchAllChildBlocks(mockClient as any, 'page-id');

      expect(result).toEqual({
        blocks: mockBlocks,
        totalBlocks: 3,
        wasLimited: false
      });
      expect(mockClient.blocks.children.list).toHaveBeenCalledTimes(1);
      expect(mockClient.blocks.children.list).toHaveBeenCalledWith({
        block_id: 'page-id',
        page_size: EXTRACTION_CONFIG.maxBlocksPerRequest,
        start_cursor: undefined
      });
    });

    it('should handle pagination for child blocks', async () => {
      const blocks1 = Array.from({ length: 100 }, (_, i) =>
        createMockTodoBlock(`block-${i}`, `Todo ${i}`, i % 2 === 0)
      );
      const blocks2 = Array.from({ length: 25 }, (_, i) =>
        createMockTodoBlock(`block-${i + 100}`, `Todo ${i + 100}`, false)
      );

      mockClient.blocks.children.list
        .mockResolvedValueOnce(createMockBlockListResponse(blocks1, true, 'cursor-1'))
        .mockResolvedValueOnce(createMockBlockListResponse(blocks2, false));

      const result = await fetchAllChildBlocks(mockClient as any, 'page-id');

      expect(result).toEqual({
        blocks: [...blocks1, ...blocks2],
        totalBlocks: 125,
        wasLimited: false
      });
      expect(mockClient.blocks.children.list).toHaveBeenCalledTimes(2);
    });

    it('should respect maxBlocks limit', async () => {
      const allBlocks = Array.from({ length: 100 }, (_, i) =>
        createMockTodoBlock(`block-${i}`, `Todo ${i}`, false)
      );
      mockClient.blocks.children.list.mockResolvedValueOnce(
        createMockBlockListResponse(allBlocks, true, 'cursor-1')
      );

      const result = await fetchAllChildBlocks(mockClient as any, 'page-id', 30);

      expect(result).toEqual({
        blocks: allBlocks.slice(0, 30),
        totalBlocks: 30,
        wasLimited: true
      });
      expect(mockClient.blocks.children.list).toHaveBeenCalledWith({
        block_id: 'page-id',
        page_size: 30,
        start_cursor: undefined
      });
    });
  });

  describe('processPagesInBatches', () => {
    it('should process pages in batches', async () => {
      const pages = Array.from({ length: 10 }, (_, i) => createMockPage(`page-${i}`, `Page ${i}`));
      const processor = vi.fn().mockImplementation(async page => ({
        pageId: page.id,
        processed: true
      }));

      const result = await processPagesInBatches(pages, 3, processor);

      expect(processor).toHaveBeenCalledTimes(10);
      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({ pageId: 'page-0', processed: true });
    });

    it('should handle empty pages array', async () => {
      const processor = vi.fn();
      const result = await processPagesInBatches([], 5, processor);

      expect(processor).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle processor errors', async () => {
      const pages = [createMockPage('page-1', 'Page 1')];
      const processor = vi.fn().mockRejectedValueOnce(new Error('Processing failed'));

      await expect(processPagesInBatches(pages, 1, processor))
        .rejects.toThrow('Processing failed');
    });
  });

  describe('rate limiting', () => {
    it('should add delays between requests', async () => {
      const pages = Array.from({ length: 200 }, (_, i) => createMockPage(`page-${i}`, `Page ${i}`));

      // Mock responses for pagination
      mockClient.databases.query
        .mockResolvedValueOnce(createMockDatabaseQueryResponse(pages.slice(0, 100), true, 'cursor-1'))
        .mockResolvedValueOnce(createMockDatabaseQueryResponse(pages.slice(100), false));

      const startTime = Date.now();
      await fetchAllDatabasePages(mockClient as any, 'database-id');
      const endTime = Date.now();

      // Should have added at least one delay between requests
      expect(endTime - startTime).toBeGreaterThanOrEqual(EXTRACTION_CONFIG.requestDelayMs);
    });
  });
});
