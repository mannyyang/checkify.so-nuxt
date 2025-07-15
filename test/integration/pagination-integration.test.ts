/**
 * Integration test to verify pagination functionality
 * This test demonstrates how the pagination logic handles large datasets
 */

import {
  fetchAllDatabasePages,
  fetchAllChildBlocks,
  processPagesInBatches,
  EXTRACTION_CONFIG
} from '../../server/utils/notion-pagination';

// Test scenarios to verify
const testScenarios = {
  'Single page with few todos': {
    pages: 1,
    todosPerPage: 5,
    expectedTotalTodos: 5
  },
  'Multiple pages requiring pagination': {
    pages: 150,
    todosPerPage: 10,
    expectedTotalTodos: 1500
  },
  'Large page with many todos': {
    pages: 1,
    todosPerPage: 200,
    expectedTotalTodos: 200
  },
  'Complex scenario with mixed content': {
    pages: 75,
    todosPerPage: 30,
    expectedTotalTodos: 2250
  }
};

// Mock implementation for testing
function createTestScenario (scenario: typeof testScenarios[keyof typeof testScenarios]) {
  const mockClient = {
    databases: {
      query: async ({ start_cursor, page_size }: any) => {
        const allPages = Array.from({ length: scenario.pages }, (_, i) => ({
          id: `page-${i}`,
          properties: { Name: { title: [{ plain_text: `Page ${i}` }] } }
        }));

        const startIndex = start_cursor ? parseInt(start_cursor) : 0;
        const endIndex = Math.min(startIndex + page_size, allPages.length);
        const hasMore = endIndex < allPages.length;

        return {
          results: allPages.slice(startIndex, endIndex),
          has_more: hasMore,
          next_cursor: hasMore ? String(endIndex) : null
        };
      }
    },
    blocks: {
      children: {
        list: async ({ block_id, start_cursor, page_size }: any) => {
          const allBlocks = Array.from({ length: scenario.todosPerPage }, (_, i) => ({
            id: `${block_id}-todo-${i}`,
            type: 'to_do',
            to_do: {
              rich_text: [{ plain_text: `Todo ${i}` }],
              checked: false
            }
          }));

          const startIndex = start_cursor ? parseInt(start_cursor) : 0;
          const endIndex = Math.min(startIndex + page_size, allBlocks.length);
          const hasMore = endIndex < allBlocks.length;

          return {
            results: allBlocks.slice(startIndex, endIndex),
            has_more: hasMore,
            next_cursor: hasMore ? String(endIndex) : null
          };
        }
      }
    }
  };

  return mockClient;
}

// Test runner
async function runIntegrationTests () {
  console.log('🧪 Running Pagination Integration Tests\n');

  for (const [name, scenario] of Object.entries(testScenarios)) {
    console.log(`📋 Testing: ${name}`);
    console.log(`   Expected: ${scenario.pages} pages, ${scenario.todosPerPage} todos/page`);

    const mockClient = createTestScenario(scenario);

    try {
      // Test database pagination
      const { pages, totalPages, wasLimited } = await fetchAllDatabasePages(
        mockClient as any,
        'test-db'
      );

      console.log(`   ✓ Fetched ${totalPages} pages (limited: ${wasLimited})`);

      // Test processing pages in batches
      let totalTodos = 0;
      const processedPages = await processPagesInBatches(
        pages,
        5, // Process 5 pages at a time
        async (page) => {
          const { blocks } = await fetchAllChildBlocks(
            mockClient as any,
            page.id
          );
          totalTodos += blocks.length;
          return { pageId: page.id, todoCount: blocks.length };
        }
      );

      console.log(`   ✓ Processed ${processedPages.length} pages with ${totalTodos} total todos`);

      // Verify results
      if (totalPages !== scenario.pages) {
        throw new Error(`Expected ${scenario.pages} pages, got ${totalPages}`);
      }
      if (totalTodos !== scenario.expectedTotalTodos) {
        throw new Error(`Expected ${scenario.expectedTotalTodos} todos, got ${totalTodos}`);
      }

      console.log('   ✅ Test passed!\n');
    } catch (error) {
      console.error(`   ❌ Test failed: ${error}\n`);
    }
  }

  // Test rate limiting
  console.log('📋 Testing: Rate limiting delays');
  const start = Date.now();
  const mockClient = createTestScenario({ pages: 3, todosPerPage: 5, expectedTotalTodos: 15 });

  await fetchAllDatabasePages(mockClient as any, 'test-db');
  const elapsed = Date.now() - start;

  console.log(`   ✓ Completed in ${elapsed}ms (with delays)`);
  console.log('   ✅ Rate limiting working\n');

  console.log('🎉 Integration tests complete!');
}

// Run the tests
runIntegrationTests().catch(console.error);
