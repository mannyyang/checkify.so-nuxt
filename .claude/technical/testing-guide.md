# Testing Guide

This document provides comprehensive documentation for the testing infrastructure and approach used in Checkify.so.

## Overview

Checkify.so uses a multi-layered testing approach to ensure reliability and maintainability:

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and feature testing
- **E2E Tests**: Full user workflow testing
- **Manual Testing**: User acceptance and exploratory testing

## Testing Stack

### Core Testing Tools

- **Vitest**: Primary test runner and assertion library
- **@vue/test-utils**: Vue component testing utilities
- **jsdom**: DOM simulation for component tests
- **MSW (Mock Service Worker)**: API mocking
- **Playwright** (planned): E2E testing framework

### Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '.nuxt/',
        'dist/'
      ]
    },
    globals: true
  }
});
```

## Test Structure

### Directory Organization

```
test/
├── components/           # Component unit tests
│   ├── sidebar.test.ts  # Sidebar component tests
│   └── ui/              # UI component tests
├── server/              # Server-side tests
│   └── api/             # API endpoint tests
│       └── sync-to-notion.test.ts
├── utils/               # Utility function tests
├── fixtures/            # Test data and mocks
├── setup.ts             # Test setup and configuration
└── e2e-test-scenarios.md # E2E test documentation
```

## Component Testing

### Basic Component Test

```typescript
// test/components/ui/Button.test.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import Button from '@/components/ui/Button.vue';

describe('Button', () => {
  it('renders with correct text', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    });
    
    expect(wrapper.text()).toBe('Click me');
  });

  it('emits click event', async () => {
    const wrapper = mount(Button);
    await wrapper.trigger('click');
    
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('applies variant classes correctly', () => {
    const wrapper = mount(Button, {
      props: { variant: 'destructive' }
    });
    
    expect(wrapper.classes()).toContain('bg-destructive');
  });
});
```

### Sidebar Component Tests

```typescript
// test/components/sidebar.test.ts
import { describe, it, expect } from 'vitest';
import { 
  SIDEBAR_WIDTH, 
  SIDEBAR_WIDTH_ICON, 
  SIDEBAR_KEYBOARD_SHORTCUT 
} from '@/lib/sidebar-constants';

describe('Sidebar Constants', () => {
  it('has correct width values', () => {
    expect(SIDEBAR_WIDTH).toBe('20rem');
    expect(SIDEBAR_WIDTH_ICON).toBe('3rem');
  });

  it('has correct keyboard shortcut', () => {
    expect(SIDEBAR_KEYBOARD_SHORTCUT).toBe('s');
  });
});
```

### Complex Component Testing

```typescript
// test/components/TodoList.test.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import TodoList from '@/components/TodoList.vue';

describe('TodoList', () => {
  const mockTodos = [
    { id: '1', text: 'Task 1', checked: false },
    { id: '2', text: 'Task 2', checked: true }
  ];

  it('renders all todos', () => {
    const wrapper = mount(TodoList, {
      props: { todos: mockTodos }
    });
    
    expect(wrapper.findAll('[data-testid="todo-item"]')).toHaveLength(2);
  });

  it('toggles todo when clicked', async () => {
    const wrapper = mount(TodoList, {
      props: { todos: mockTodos }
    });
    
    await wrapper.find('[data-testid="todo-checkbox-1"]').trigger('click');
    
    expect(wrapper.emitted('toggle')).toEqual([['1']]);
  });
});
```

## API Testing

### Sync-to-Notion API Tests

```typescript
// test/server/api/sync-to-notion.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Sync to Notion API', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('POST /api/todo-list/sync-to-notion', () => {
    it('creates new sync database successfully', async () => {
      const mockTodoList = {
        id: 123,
        notion_database_id: 'test-db-id',
        sync_database_id: null
      };

      const mockNotionResponse = {
        id: 'sync-db-id',
        url: 'https://notion.so/sync-db-id',
        title: [{ plain_text: 'Sync Database' }]
      };

      // Mock Notion API calls
      mockNotionClient.databases.create.mockResolvedValue(mockNotionResponse);
      
      const response = await request(app)
        .post('/api/todo-list/sync-to-notion')
        .send({
          todo_list_id: 123,
          parent_page_id: 'parent-page-id'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        syncDatabaseId: 'sync-db-id',
        syncDatabaseUrl: 'https://notion.so/sync-db-id',
        syncResults: expect.objectContaining({
          created: expect.any(Number),
          updated: expect.any(Number),
          errors: expect.any(Array)
        }),
        totalCheckboxes: expect.any(Number),
        pageCount: expect.any(Number)
      });
    });

    it('handles database creation errors', async () => {
      mockNotionClient.databases.create.mockRejectedValue(
        new Error('Permission denied')
      );

      const response = await request(app)
        .post('/api/todo-list/sync-to-notion')
        .send({ todo_list_id: 123 })
        .expect(403);

      expect(response.body).toEqual({
        statusCode: 403,
        statusMessage: expect.stringContaining('Permission denied')
      });
    });

    it('updates existing sync database', async () => {
      const mockTodoList = {
        id: 123,
        notion_database_id: 'test-db-id',
        sync_database_id: 'existing-sync-db-id'
      };

      mockNotionClient.databases.retrieve.mockResolvedValue({
        id: 'existing-sync-db-id',
        url: 'https://notion.so/existing-sync-db-id'
      });

      const response = await request(app)
        .post('/api/todo-list/sync-to-notion')
        .send({ todo_list_id: 123 })
        .expect(200);

      expect(response.body.syncDatabaseId).toBe('existing-sync-db-id');
      expect(mockNotionClient.databases.create).not.toHaveBeenCalled();
    });
  });

  describe('URL parsing integration', () => {
    it('extracts parent page ID from Notion URL', () => {
      const testCases = [
        {
          url: 'https://notion.so/workspace/Page-Title-abc123def456',
          expected: 'abc123def456'
        },
        {
          url: 'https://notion.so/Page-abc123def456?v=view123',
          expected: 'abc123def456'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        const result = extractPageIdFromUrl(url);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Foreign key handling', () => {
    it('handles Supabase foreign key expansion', async () => {
      // Test that foreign key returns object, not array
      const mockTodoList = {
        id: 123,
        notion_database: {  // Object, not array
          id: 'db-id',
          name: 'My Database'
        }
      };

      expect(mockTodoList.notion_database).toBeInstanceOf(Object);
      expect(Array.isArray(mockTodoList.notion_database)).toBe(false);
    });
  });

  describe('Error scenarios', () => {
    it('handles missing rich_text gracefully', async () => {
      const todosWithMissingText = [
        { 
          id: 'block-1',
          to_do: { 
            rich_text: undefined,  // Missing rich_text
            checked: false 
          }
        }
      ];

      const result = await processTodos(todosWithMissingText);
      
      expect(result.errors).toHaveLength(0);  // Should handle gracefully
      expect(result.created).toBe(0);         // Should skip invalid todos
      expect(result.skipped).toBe(1);
    });

    it('continues processing after individual failures', async () => {
      const mixedTodos = [
        { id: 'valid-1', text: 'Valid todo 1', checked: false },
        { id: 'invalid', text: null, checked: false },  // Will fail
        { id: 'valid-2', text: 'Valid todo 2', checked: true }
      ];

      const result = await syncTodos(mixedTodos);
      
      expect(result.created).toBe(2);         // 2 valid todos processed
      expect(result.errors).toHaveLength(1);  // 1 error recorded
    });
  });
});
```

### Authentication Testing

```typescript
// test/server/middleware/auth.test.ts
describe('Authentication Middleware', () => {
  it('allows authenticated requests', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockSupabaseAuth.getUser.mockResolvedValue({ user: mockUser });

    const response = await request(app)
      .get('/api/protected-endpoint')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);
  });

  it('rejects unauthenticated requests', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ user: null });

    await request(app)
      .get('/api/protected-endpoint')
      .expect(401);
  });
});
```

## Utility Testing

```typescript
// test/utils/notion-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { extractPageIdFromUrl, formatNotionText } from '@/utils/notion-helpers';

describe('Notion Helpers', () => {
  describe('extractPageIdFromUrl', () => {
    it('extracts ID from various URL formats', () => {
      const testCases = [
        {
          url: 'https://notion.so/Page-abc123def456',
          expected: 'abc123def456'
        },
        {
          url: 'https://notion.so/workspace/Page-Title-abc123def456?v=view123',
          expected: 'abc123def456'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractPageIdFromUrl(url)).toBe(expected);
      });
    });
  });

  describe('formatNotionText', () => {
    it('converts rich text to plain text', () => {
      const richText = [
        { type: 'text', text: { content: 'Hello ' } },
        { type: 'text', text: { content: 'world' }, annotations: { bold: true } }
      ];

      expect(formatNotionText(richText)).toBe('Hello world');
    });

    it('handles empty rich text', () => {
      expect(formatNotionText([])).toBe('');
      expect(formatNotionText(undefined)).toBe('');
    });
  });
});
```

## Mocking Strategies

### Notion API Mocking

```typescript
// test/mocks/notion.ts
import { vi } from 'vitest';

export const mockNotionClient = {
  databases: {
    create: vi.fn(),
    retrieve: vi.fn(),
    query: vi.fn()
  },
  pages: {
    create: vi.fn(),
    update: vi.fn(),
    retrieve: vi.fn()
  },
  blocks: {
    children: {
      list: vi.fn(),
      append: vi.fn()
    },
    update: vi.fn()
  }
};
```

### Supabase Mocking

```typescript
// test/mocks/supabase.ts
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  })),
  auth: {
    getUser: vi.fn()
  }
};
```

## Testing Commands

### Available Scripts

```json
{
  "scripts": {
    "test:unit": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Running Tests

```bash
# Run all tests
pnpm test:unit

# Run tests in watch mode
pnpm test:watch

# Run tests with UI interface
pnpm test:ui

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test:unit test/components/sidebar.test.ts

# Run tests matching pattern
pnpm test:unit --grep "sync-to-notion"
```

## Coverage Requirements

### Current Coverage

- **API Endpoints**: 90%+ coverage for critical paths
- **Utility Functions**: 100% coverage for pure functions
- **Components**: 80%+ coverage for core components
- **Error Handling**: All error scenarios tested

### Coverage Goals

```typescript
// vitest.config.ts coverage thresholds
coverage: {
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80
}
```

## E2E Testing

### Test Scenarios

Documented in `test/e2e-test-scenarios.md`:

1. **User Registration and Onboarding**
2. **Notion Connection Flow**
3. **Todo List Creation**
4. **Sync-to-Notion Feature**
5. **Subscription Management**

### Playwright Setup (Planned)

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './test/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

## Testing Best Practices

### 1. Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup for each test
  });

  describe('happy path', () => {
    it('should handle normal case', () => {
      // Test implementation
    });
  });

  describe('error cases', () => {
    it('should handle invalid input', () => {
      // Test implementation
    });
  });
});
```

### 2. Assertion Patterns

```typescript
// Good: Specific assertions
expect(response.body).toEqual({
  success: true,
  data: expect.objectContaining({
    id: expect.any(String)
  })
});

// Avoid: Vague assertions
expect(response.body).toBeTruthy();
```

### 3. Mock Management

```typescript
// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock only what's necessary
vi.mock('@/utils/notion-client', () => ({
  createDatabase: vi.fn()
}));
```

### 4. Test Data

```typescript
// Use factories for consistent test data
const createMockTodoList = (overrides = {}) => ({
  id: 123,
  notion_database_id: 'test-db-id',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});
```

## Continuous Integration

### GitHub Actions (Planned)

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

## Debugging Tests

### Debug Techniques

1. **Console Logging**: Use `console.log` in tests (removed in CI)
2. **Test UI**: Use `pnpm test:ui` for interactive debugging
3. **Focused Tests**: Use `.only()` for specific test debugging
4. **Mock Inspection**: Log mock calls to understand behavior

```typescript
// Debug mock calls
console.log('Mock calls:', mockFunction.mock.calls);

// Run single test
it.only('should debug this specific case', () => {
  // Test implementation
});
```

## Performance Testing

### Load Testing (Planned)

```typescript
// test/performance/sync-load.test.ts
describe('Sync Performance', () => {
  it('handles 100 todos within 30 seconds', async () => {
    const largeTodoList = generateTodos(100);
    const startTime = Date.now();
    
    await syncTodosToNotion(largeTodoList);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000);
  });
});
```

## Documentation Testing

### API Documentation Validation

```typescript
// test/docs/api-docs.test.ts
describe('API Documentation', () => {
  it('matches actual API responses', async () => {
    const response = await request(app).get('/api/todo-list');
    
    // Validate response matches documented schema
    expect(response.body).toMatchSchema(todoListSchema);
  });
});
```

This comprehensive testing infrastructure ensures the reliability and maintainability of Checkify.so while providing clear guidelines for future development.