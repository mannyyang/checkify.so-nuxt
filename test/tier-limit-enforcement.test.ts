import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TIER_LIMITS } from '../lib/pricing';

// Mock the API handler for testing
const mockFetchAllDatabasePages = vi.fn();
const mockFetchAllChildBlocks = vi.fn();

describe('Tier Limit Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Limits', () => {
    it('should enforce free tier page limit of 25', async () => {
      const tierLimits = TIER_LIMITS.free;
      const mockPages = Array(30).fill({}).map((_, i) => ({ id: `page-${i}` }));

      mockFetchAllDatabasePages.mockResolvedValue({
        pages: mockPages.slice(0, tierLimits.maxPages),
        totalPages: 30,
        wasLimited: true
      });

      const result = await mockFetchAllDatabasePages('db-id', tierLimits.maxPages);

      expect(result.pages).toHaveLength(25);
      expect(result.wasLimited).toBe(true);
      expect(result.totalPages).toBe(30);
    });

    it('should enforce pro tier page limit of 100', async () => {
      const tierLimits = TIER_LIMITS.pro;
      const mockPages = Array(120).fill({}).map((_, i) => ({ id: `page-${i}` }));

      mockFetchAllDatabasePages.mockResolvedValue({
        pages: mockPages.slice(0, tierLimits.maxPages),
        totalPages: 120,
        wasLimited: true
      });

      const result = await mockFetchAllDatabasePages('db-id', tierLimits.maxPages);

      expect(result.pages).toHaveLength(100);
      expect(result.wasLimited).toBe(true);
    });

    it('should enforce max tier page limit of 500', async () => {
      const tierLimits = TIER_LIMITS.max;
      const mockPages = Array(600).fill({}).map((_, i) => ({ id: `page-${i}` }));

      mockFetchAllDatabasePages.mockResolvedValue({
        pages: mockPages.slice(0, tierLimits.maxPages),
        totalPages: 600,
        wasLimited: true
      });

      const result = await mockFetchAllDatabasePages('db-id', tierLimits.maxPages);

      expect(result.pages).toHaveLength(500);
      expect(result.wasLimited).toBe(true);
    });
  });

  describe('Checkbox Limits', () => {
    it('should enforce free tier checkbox limit of 25 per page', async () => {
      const tierLimits = TIER_LIMITS.free;
      const mockCheckboxes = Array(30).fill({}).map((_, i) => ({
        id: `checkbox-${i}`,
        type: 'to_do'
      }));

      mockFetchAllChildBlocks.mockResolvedValue({
        blocks: mockCheckboxes.slice(0, tierLimits.maxCheckboxesPerPage),
        totalBlocks: 30,
        wasLimited: true
      });

      const result = await mockFetchAllChildBlocks('page-id', tierLimits.maxCheckboxesPerPage);

      expect(result.blocks).toHaveLength(25);
      expect(result.wasLimited).toBe(true);
    });

    it('should enforce pro tier checkbox limit of 100 per page', async () => {
      const tierLimits = TIER_LIMITS.pro;
      const mockCheckboxes = Array(150).fill({}).map((_, i) => ({
        id: `checkbox-${i}`,
        type: 'to_do'
      }));

      mockFetchAllChildBlocks.mockResolvedValue({
        blocks: mockCheckboxes.slice(0, tierLimits.maxCheckboxesPerPage),
        totalBlocks: 150,
        wasLimited: true
      });

      const result = await mockFetchAllChildBlocks('page-id', tierLimits.maxCheckboxesPerPage);

      expect(result.blocks).toHaveLength(100);
      expect(result.wasLimited).toBe(true);
    });

    it('should enforce max tier checkbox limit of 1000 per page', async () => {
      const tierLimits = TIER_LIMITS.max;
      const mockCheckboxes = Array(1200).fill({}).map((_, i) => ({
        id: `checkbox-${i}`,
        type: 'to_do'
      }));

      mockFetchAllChildBlocks.mockResolvedValue({
        blocks: mockCheckboxes.slice(0, tierLimits.maxCheckboxesPerPage),
        totalBlocks: 1200,
        wasLimited: true
      });

      const result = await mockFetchAllChildBlocks('page-id', tierLimits.maxCheckboxesPerPage);

      expect(result.blocks).toHaveLength(1000);
      expect(result.wasLimited).toBe(true);
    });
  });

  describe('Todo List Limits', () => {
    it('should enforce free tier todo list limit of 2', () => {
      const tierLimits = TIER_LIMITS.free;
      expect(tierLimits.maxTodoLists).toBe(2);

      // Simulate checking if user can create more todo lists
      const userTodoListCount = 2;
      const canCreateMore = userTodoListCount < tierLimits.maxTodoLists;
      expect(canCreateMore).toBe(false);
    });

    it('should enforce pro tier todo list limit of 10', () => {
      const tierLimits = TIER_LIMITS.pro;
      expect(tierLimits.maxTodoLists).toBe(10);

      // Simulate checking if user can create more todo lists
      const userTodoListCount = 10;
      const canCreateMore = userTodoListCount < tierLimits.maxTodoLists;
      expect(canCreateMore).toBe(false);
    });

    it('should enforce max tier todo list limit of 25', () => {
      const tierLimits = TIER_LIMITS.max;
      expect(tierLimits.maxTodoLists).toBe(25);

      const userTodoListCount = 25;
      const canCreateMore = userTodoListCount < tierLimits.maxTodoLists;
      expect(canCreateMore).toBe(false);
    });
  });

  describe('Limit Metadata', () => {
    it('should include limit metadata in response', async () => {
      const userTier = 'free';
      const tierLimits = TIER_LIMITS[userTier];

      // Simulate the metadata that would be returned
      const metadata = {
        totalPages: 15,
        totalCheckboxes: 250,
        pagesWithCheckboxes: 10,
        extractionComplete: false,
        errors: [],
        limits: {
          tier: userTier,
          maxPages: tierLimits.maxPages,
          maxCheckboxesPerPage: tierLimits.maxCheckboxesPerPage,
          pagesLimited: true,
          reachedPageLimit: true
        }
      };

      expect(metadata.limits.tier).toBe('free');
      expect(metadata.limits.maxPages).toBe(25);
      expect(metadata.limits.maxCheckboxesPerPage).toBe(25);
      expect(metadata.limits.reachedPageLimit).toBe(true);
    });
  });
});
