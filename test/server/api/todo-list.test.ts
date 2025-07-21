import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createError } from 'h3';
import type { H3Event } from 'h3';
import {
  createMockPage,
  createMockTodoBlock,
  createMockParagraphBlock,
  createMockDatabaseQueryResponse,
  createMockBlockListResponse,
  createMockNotionClient
} from '../../mocks/notion-client';

// Import after mocks are set up
import todoListHandler from '~/server/api/todo-list/[todo_list_id]';
import { fetchAllDatabasePages, fetchAllChildBlocks, processPagesInBatches } from '~/server/utils/notion-pagination';

// Mock dependencies
vi.mock('@notionhq/client', () => ({
  Client: vi.fn().mockImplementation(() => createMockNotionClient()),
  isFullBlock: (block: any) => !!block.type
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn()
      })
    })
  })
}));

vi.mock('~/server/utils/notion-pagination', () => ({
  EXTRACTION_CONFIG: {
    maxPagesPerRequest: 100,
    maxBlocksPerRequest: 100,
    maxConcurrentRequests: 5,
    requestDelayMs: 100
  },
  fetchAllDatabasePages: vi.fn(),
  fetchAllChildBlocks: vi.fn(),
  processPagesInBatches: vi.fn()
}));

describe('/api/todo-list/[todo_list_id]', () => {
  let mockEvent: Partial<H3Event>;
  let mockSupabaseData: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEvent = {
      context: {
        params: {
          todo_list_id: 'test-todo-list-id'
        }
      }
    };

    mockSupabaseData = [{
      notion_database_id: {
        notion_database_id: 'test-database-id',
        access_token: 'test-access-token'
      },
      notion_sync_database_id: 'sync-db-id',
      last_sync_date: '2024-01-01T00:00:00Z'
    }];

    // Mock getRouterParam
    vi.stubGlobal('getRouterParam', () => 'test-todo-list-id');

    // Mock createError
    vi.stubGlobal('createError', createError);
  });

  it('should successfully fetch and return todo list with pagination', async () => {
    // Mock Supabase response
    const mockSupabase = (await import('@supabase/supabase-js')).createClient('', '');
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null
        })
      })
    } as any);

    // Mock pages with todos
    const mockPages = [
      createMockPage('page-1', 'Project A'),
      createMockPage('page-2', 'Project B')
    ];

    const mockTodos1 = [
      createMockTodoBlock('todo-1', 'Complete feature', false),
      createMockTodoBlock('todo-2', 'Write tests', true),
      createMockParagraphBlock('para-1', 'Some notes')
    ];

    const mockTodos2 = [
      createMockTodoBlock('todo-3', 'Review PR', false)
    ];

    // Mock pagination functions
    vi.mocked(fetchAllDatabasePages).mockResolvedValue({
      pages: mockPages,
      totalPages: 2,
      wasLimited: false
    });

    vi.mocked(fetchAllChildBlocks)
      .mockResolvedValueOnce({
        blocks: mockTodos1,
        totalBlocks: 3,
        wasLimited: false
      })
      .mockResolvedValueOnce({
        blocks: mockTodos2,
        totalBlocks: 1,
        wasLimited: false
      });

    vi.mocked(processPagesInBatches).mockImplementation(async (pages, batchSize, processor) => {
      const results = [];
      for (const page of pages) {
        const result = await processor(page);
        results.push(result);
      }
      return results;
    });

    // Call the handler
    const result = await todoListHandler(mockEvent as H3Event);

    expect(result).toEqual({
      pages: expect.arrayContaining([
        expect.objectContaining({
          page: expect.objectContaining({ id: 'page-1' }),
          checkboxes: expect.arrayContaining([
            expect.objectContaining({ id: 'todo-1' }),
            expect.objectContaining({ id: 'todo-2' })
          ])
        }),
        expect.objectContaining({
          page: expect.objectContaining({ id: 'page-2' }),
          checkboxes: expect.arrayContaining([
            expect.objectContaining({ id: 'todo-3' })
          ])
        })
      ]),
      syncInfo: {
        syncDatabaseId: 'sync-db-id',
        lastSyncDate: '2024-01-01T00:00:00Z'
      },
      metadata: {
        totalPages: 2,
        totalCheckboxes: 3,
        pagesWithCheckboxes: 2,
        extractionComplete: true,
        errors: []
      }
    });

    expect(fetchAllDatabasePages).toHaveBeenCalledWith(
      expect.any(Object),
      'test-database-id'
    );
    expect(processPagesInBatches).toHaveBeenCalledWith(
      mockPages,
      5,
      expect.any(Function)
    );
  });

  it('should handle pages without checkboxes', async () => {
    const mockSupabase = (await import('@supabase/supabase-js')).createClient('', '');
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null
        })
      })
    } as any);

    const mockPages = [
      createMockPage('page-1', 'Empty Page'),
      createMockPage('page-2', 'Page with Todos')
    ];

    vi.mocked(fetchAllDatabasePages).mockResolvedValue({
      pages: mockPages,
      totalPages: 2,
      wasLimited: false
    });

    // First page has no todos, second page has todos
    vi.mocked(fetchAllChildBlocks)
      .mockResolvedValueOnce({
        blocks: [createMockParagraphBlock('para-1', 'Just text')],
        totalBlocks: 1,
        wasLimited: false
      })
      .mockResolvedValueOnce({
        blocks: [createMockTodoBlock('todo-1', 'A todo', false)],
        totalBlocks: 1,
        wasLimited: false
      });

    vi.mocked(processPagesInBatches).mockImplementation(async (pages, batchSize, processor) => {
      const results = [];
      for (const page of pages) {
        const result = await processor(page);
        results.push(result);
      }
      return results;
    });

    const result = await todoListHandler(mockEvent as H3Event);

    // Should only include pages with checkboxes
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].page.id).toBe('page-2');
    expect(result.metadata.pagesWithCheckboxes).toBe(1);
    expect(result.metadata.totalCheckboxes).toBe(1);
  });

  it('should handle extraction errors gracefully', async () => {
    const mockSupabase = (await import('@supabase/supabase-js')).createClient('', '');
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null
        })
      })
    } as any);

    const mockPages = [
      createMockPage('page-1', 'Page 1'),
      createMockPage('page-2', 'Page 2')
    ];

    vi.mocked(fetchAllDatabasePages).mockResolvedValue({
      pages: mockPages,
      totalPages: 2,
      wasLimited: false
    });

    // First page succeeds, second page fails
    vi.mocked(fetchAllChildBlocks)
      .mockResolvedValueOnce({
        blocks: [createMockTodoBlock('todo-1', 'Todo 1', false)],
        totalBlocks: 1,
        wasLimited: false
      })
      .mockRejectedValueOnce(new Error('API Error'));

    vi.mocked(processPagesInBatches).mockImplementation(async (pages, batchSize, processor) => {
      const results = [];
      for (const page of pages) {
        const result = await processor(page);
        results.push(result);
      }
      return results;
    });

    const result = await todoListHandler(mockEvent as H3Event);

    expect(result.pages).toHaveLength(1); // Only successful page
    expect(result.metadata.errors).toHaveLength(1);
    expect(result.metadata.errors[0]).toContain('Failed to fetch blocks for page page-2');
    expect(result.metadata.extractionComplete).toBe(false);
  });

  it('should throw error when todo_list_id is missing', async () => {
    vi.stubGlobal('getRouterParam', () => null);

    await expect(todoListHandler(mockEvent as H3Event))
      .rejects.toThrow('No todo_list_id found');
  });

  it('should throw error when todo list is not found in database', async () => {
    const mockSupabase = (await import('@supabase/supabase-js')).createClient('', '');
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    } as any);

    await expect(todoListHandler(mockEvent as H3Event))
      .rejects.toThrow('No todo list found');
  });

  it('should handle Supabase errors', async () => {
    const mockSupabase = (await import('@supabase/supabase-js')).createClient('', '');
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      })
    } as any);

    await expect(todoListHandler(mockEvent as H3Event))
      .rejects.toThrow('Database error');
  });

  it('should indicate when extraction was limited', async () => {
    const mockSupabase = (await import('@supabase/supabase-js')).createClient('', '');
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null
        })
      })
    } as any);

    const mockPages = [createMockPage('page-1', 'Page 1')];

    // Simulate that pagination was limited
    vi.mocked(fetchAllDatabasePages).mockResolvedValue({
      pages: mockPages,
      totalPages: 1,
      wasLimited: true
    });

    vi.mocked(fetchAllChildBlocks).mockResolvedValue({
      blocks: [createMockTodoBlock('todo-1', 'Todo 1', false)],
      totalBlocks: 1,
      wasLimited: false
    });

    vi.mocked(processPagesInBatches).mockImplementation(async (pages, batchSize, processor) => {
      const results = [];
      for (const page of pages) {
        const result = await processor(page);
        results.push(result);
      }
      return results;
    });

    const result = await todoListHandler(mockEvent as H3Event);

    expect(result.metadata.extractionComplete).toBe(false);
  });
});
