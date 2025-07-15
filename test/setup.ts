import { vi } from 'vitest';

// Mock console methods during tests
global.console = {
  ...console,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Set up global mocks
vi.mock('consola', () => ({
  consola: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    ready: vi.fn(),
    start: vi.fn(),
    success: vi.fn()
  }
}));
