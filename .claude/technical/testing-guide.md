# Testing Guide

This guide covers the testing approach, tools, and best practices for Checkify.so.

## Overview

Checkify.so uses **Vitest** as the primary testing framework, providing:
- Fast test execution
- Native TypeScript support
- Compatible with Jest APIs
- Built-in mocking capabilities
- UI mode for interactive testing

## Test Structure

```
test/
├── components/           # Component tests
│   ├── sidebar.test.ts
│   └── ...
├── composables/         # Composable tests
│   ├── useSubscription.test.ts
│   └── ...
├── server/             # Server-side tests
│   ├── api/           # API endpoint tests
│   │   ├── sync-to-notion.test.ts
│   │   └── todo-list-creation.test.ts
│   └── utils/         # Utility function tests
├── utils/              # Client utility tests
│   └── notion-url-parser.test.ts
├── integration/        # Integration tests
└── tier-limit-enforcement.test.ts  # Feature tests
```

## Running Tests

### Basic Commands
```bash
# Run all tests
pnpm test:unit

# Run tests in watch mode
pnpm test:unit -- --watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test:unit components/sidebar.test.ts

# Run tests matching pattern
pnpm test:unit -- --grep "subscription"
```

### Test Environments
- **Unit Tests**: Run in isolation with mocked dependencies
- **Integration Tests**: Test multiple components together
- **API Tests**: Test server endpoints with mocked external services

## Writing Tests

### Component Tests
```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import AppSidebar from '~/components/AppSidebar.vue';

describe('AppSidebar', () => {
  it('renders navigation items', () => {
    const wrapper = mount(AppSidebar, {
      global: {
        stubs: ['NuxtLink', 'Icon']
      }
    });
    
    expect(wrapper.find('[data-testid="nav-home"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nav-todos"]').exists()).toBe(true);
  });

  it('toggles sidebar on mobile', async () => {
    const wrapper = mount(AppSidebar);
    const toggleButton = wrapper.find('[data-testid="sidebar-toggle"]');
    
    await toggleButton.trigger('click');
    expect(wrapper.emitted('toggle')).toBeTruthy();
  });
});
```

### Composable Tests
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSubscription } from '~/composables/useSubscription';

describe('useSubscription', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns current tier information', () => {
    const { currentTier, limits } = useSubscription();
    
    expect(currentTier.value).toBe('free');
    expect(limits.value.maxPages).toBe(25);
    expect(limits.value.maxCheckboxesPerPage).toBe(25);
  });

  it('checks feature access correctly', () => {
    const { canAccessFeature } = useSubscription();
    
    expect(canAccessFeature('basic')).toBe(true);
    expect(canAccessFeature('automaticSync')).toBe(false);
  });
});
```

### API Endpoint Tests
```typescript
import { describe, it, expect, vi } from 'vitest';
import { createError, defineEventHandler } from 'h3';
import handler from '~/server/api/todo-list/[todo_list_id].get';

// Mock Notion client
vi.mock('@notionhq/client', () => ({
  Client: vi.fn(() => ({
    databases: {
      query: vi.fn().mockResolvedValue({
        results: mockPages,
        has_more: false
      })
    },
    blocks: {
      children: {
        list: vi.fn().mockResolvedValue({
          results: mockBlocks
        })
      }
    }
  }))
}));

describe('GET /api/todo-list/[id]', () => {
  it('enforces tier limits', async () => {
    const event = {
      context: {
        params: { todo_list_id: '123' },
        user: { id: 'user-123' }
      }
    };

    const result = await handler(event);
    
    expect(result.metadata.limits.tier).toBe('free');
    expect(result.metadata.limits.maxPages).toBe(25);
    expect(result.pages.length).toBeLessThanOrEqual(25);
  });
});
```

## Mocking Strategies

### Mocking Nuxt Features
```typescript
// Mock useRuntimeConfig
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      supabaseUrl: 'http://localhost:54321',
      stripePublishableKey: 'pk_test_123'
    }
  })
}));

// Mock navigateTo
const navigateTo = vi.fn();
vi.mock('#app', () => ({
  navigateTo
}));
```

### Mocking External Services
```typescript
// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData })
    }))
  }))
}));

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_test' })
    },
    subscriptions: {
      create: vi.fn().mockResolvedValue({ id: 'sub_test' })
    }
  }))
}));
```

## Best Practices

### Test Organization
1. **Describe blocks**: Group related tests
2. **Clear test names**: Describe what is being tested
3. **Arrange-Act-Assert**: Structure tests clearly
4. **One assertion per test**: Keep tests focused

### Test Data
```typescript
// Create test fixtures
const createMockTodoList = (overrides = {}) => ({
  id: 123,
  notion_database_id: 'db-123',
  created_at: new Date().toISOString(),
  ...overrides
});

// Use factories for complex data
const createMockPage = (todos = 5) => ({
  id: 'page-123',
  properties: {
    Name: { title: [{ plain_text: 'Test Page' }] }
  },
  checkboxes: Array.from({ length: todos }, (_, i) => ({
    id: `block-${i}`,
    type: 'to_do',
    to_do: {
      rich_text: [{ plain_text: `Todo ${i + 1}` }],
      checked: false
    }
  }))
});
```

### Async Testing
```typescript
// Test async operations
it('loads todos asynchronously', async () => {
  const { data, pending, refresh } = await useFetch('/api/todos');
  
  expect(pending.value).toBe(true);
  
  await nextTick();
  
  expect(pending.value).toBe(false);
  expect(data.value).toHaveLength(5);
});

// Test error handling
it('handles API errors gracefully', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
  
  const { error } = await useFetch('/api/todos');
  
  expect(error.value).toBeDefined();
  expect(error.value.message).toBe('Network error');
});
```

### Testing UI States
```typescript
// Test loading states
it('shows loading indicator while fetching', async () => {
  const wrapper = mount(TodoList, {
    props: { loading: true }
  });
  
  expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true);
  expect(wrapper.find('[data-testid="todo-items"]').exists()).toBe(false);
});

// Test empty states
it('shows empty state when no todos', () => {
  const wrapper = mount(TodoList, {
    props: { todos: [] }
  });
  
  expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
  expect(wrapper.text()).toContain('No todos found');
});
```

## Coverage Goals

### Target Coverage
- **Overall**: 80% coverage
- **Critical paths**: 95% coverage
- **Utilities**: 100% coverage
- **API endpoints**: 90% coverage

### Measuring Coverage
```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Configuration
```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.nuxt/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
});
```

## Continuous Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:coverage
```

## Debugging Tests

### VS Code Integration
```json
// .vscode/launch.json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["--run", "${file}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Interactive Debugging
```typescript
// Add breakpoints in tests
it('complex calculation', () => {
  const input = prepareData();
  debugger; // Breakpoint here
  const result = complexCalculation(input);
  expect(result).toBe(expected);
});
```

## Common Testing Patterns

### Testing Tier Limits
```typescript
describe('Tier Limit Enforcement', () => {
  it.each([
    ['free', 25, 25, 2],
    ['pro', 100, 100, 10],
    ['max', 500, 1000, 25]
  ])('%s tier has correct limits', (tier, pages, checkboxes, lists) => {
    const limits = getTierLimits(tier);
    expect(limits.maxPages).toBe(pages);
    expect(limits.maxCheckboxesPerPage).toBe(checkboxes);
    expect(limits.maxTodoLists).toBe(lists);
  });
});
```

### Testing Webhooks
```typescript
it('sends webhook on todo update', async () => {
  const mockWebhook = vi.fn();
  global.fetch = mockWebhook;

  await updateTodo('todo-123', { checked: true });

  expect(mockWebhook).toHaveBeenCalledWith(
    'https://webhook.site/example',
    expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"checked":true')
    })
  );
});
```

## Troubleshooting

### Common Issues

**"Cannot find module"**
- Clear node_modules and reinstall
- Check import paths use `~` for src directory

**"Timeout exceeded"**
- Increase timeout for slow tests: `it('slow test', { timeout: 10000 }, ...)`
- Mock external API calls

**"Memory leak detected"**
- Clean up after tests with `afterEach`
- Properly dispose of mounted components

### Getting Help
- Check Vitest documentation
- Review existing test examples
- Ask in team chat for complex scenarios