import { describe, it, expect } from 'vitest';

// Extract the URL parsing logic from the Vue component for testing
const extractNotionPageId = (input: string): string => {
  // If it's already a page ID (32 chars without dashes or 36 chars with dashes), return as-is
  const cleanInput = input.trim();
  const withoutDashes = cleanInput.replace(/-/g, '');

  // Check if it's already a valid page ID
  if (/^[a-f0-9]{32}$/i.test(withoutDashes) && (cleanInput.length === 32 || cleanInput.length === 36)) {
    return cleanInput;
  }

  // Try to extract from Notion URL
  // Look for the last 32-character hex string (with or without dashes)
  // This handles various URL formats including workspace URLs
  const patterns = [
    // Match 32 hex chars with optional dashes (36 chars total with dashes) at end of URL
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:\?|$)/i,
    // Match 32 consecutive hex chars at end of URL or before query params
    /([a-f0-9]{32})(?:\?|$)/i,
    // Fallback: match any 32 hex chars (for IDs in the middle of URLs)
    /([a-f0-9]{32})/i
  ];

  for (const pattern of patterns) {
    const matches = cleanInput.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first captured group
      return matches[1] || matches[0];
    }
  }

  // If no match, return the original input
  console.warn('Could not extract page ID from:', cleanInput);
  return cleanInput;
};

describe('extractNotionPageId', () => {
  describe('Valid Page IDs', () => {
    it('should return page ID when given a 32-character hex string', () => {
      const pageId = 'a9fcea1dcf4644479b098a75578988e3';
      expect(extractNotionPageId(pageId)).toBe(pageId);
    });

    it('should return page ID when given a UUID format with dashes', () => {
      const pageId = 'a9fcea1d-cf46-4447-9b09-8a75578988e3';
      expect(extractNotionPageId(pageId)).toBe(pageId);
    });

    it('should handle page IDs with spaces around them', () => {
      const pageId = '  a9fcea1dcf4644479b098a75578988e3  ';
      expect(extractNotionPageId(pageId)).toBe('a9fcea1dcf4644479b098a75578988e3');
    });
  });

  describe('Notion URLs', () => {
    it('should extract page ID from standard Notion URL', () => {
      const url = 'https://www.notion.so/a9fcea1dcf4644479b098a75578988e3';
      expect(extractNotionPageId(url)).toBe('a9fcea1dcf4644479b098a75578988e3');
    });

    it('should extract page ID from workspace URL', () => {
      const url = 'https://www.notion.so/mannyyang/Daily-a9fcea1dcf4644479b098a75578988e3';
      expect(extractNotionPageId(url)).toBe('a9fcea1dcf4644479b098a75578988e3');
    });

    it('should extract page ID from URL with query parameters', () => {
      const url = 'https://www.notion.so/mannyyang/Daily-a9fcea1dcf4644479b098a75578988e3?source=copy_link';
      expect(extractNotionPageId(url)).toBe('a9fcea1dcf4644479b098a75578988e3');
    });

    it('should extract page ID from URL with multiple path segments', () => {
      const url = 'https://www.notion.so/workspace/folder/subfolder/Page-a9fcea1dcf4644479b098a75578988e3';
      expect(extractNotionPageId(url)).toBe('a9fcea1dcf4644479b098a75578988e3');
    });

    it('should extract page ID from URL without https', () => {
      const url = 'notion.so/workspace/a9fcea1dcf4644479b098a75578988e3';
      expect(extractNotionPageId(url)).toBe('a9fcea1dcf4644479b098a75578988e3');
    });
  });

  describe('Edge Cases', () => {
    it('should return original input if no valid page ID found', () => {
      const invalidInput = 'not-a-valid-page-id';
      expect(extractNotionPageId(invalidInput)).toBe(invalidInput);
    });

    it('should return original input for non-hex strings', () => {
      const invalidId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      expect(extractNotionPageId(invalidId)).toBe(invalidId);
    });

    it('should handle empty string', () => {
      expect(extractNotionPageId('')).toBe('');
    });

    it('should handle URLs with multiple potential IDs and return the first one', () => {
      const url = 'https://notion.so/a1234567890abcdef1234567890abcde/page-b9876543210fedcba9876543210fedc';
      expect(extractNotionPageId(url)).toBe('a1234567890abcdef1234567890abcde');
    });

    it('should handle malformed URLs gracefully', () => {
      const malformed = 'https://notion.so/this-is-not-a-valid-page';
      expect(extractNotionPageId(malformed)).toBe(malformed);
    });
  });
});
