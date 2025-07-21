import { vi } from 'vitest';
import type {
  PageObjectResponse,
  BlockObjectResponse,
  QueryDatabaseResponse,
  ListBlockChildrenResponse,
  ToDoBlockObjectResponse
} from '@notionhq/client/build/src/api-endpoints';

export function createMockPage (id: string, title: string): PageObjectResponse {
  return {
    id,
    object: 'page',
    created_time: '2024-01-01T00:00:00.000Z',
    last_edited_time: '2024-01-01T00:00:00.000Z',
    created_by: {
      object: 'user',
      id: 'user-id'
    },
    last_edited_by: {
      object: 'user',
      id: 'user-id'
    },
    cover: null,
    icon: null,
    parent: {
      type: 'database_id',
      database_id: 'database-id'
    },
    archived: false,
    in_trash: false,
    public_url: null,
    properties: {
      Name: {
        id: 'title',
        type: 'title',
        title: [{
          type: 'text',
          text: { content: title, link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default'
          },
          plain_text: title,
          href: null
        }]
      }
    },
    url: `https://notion.so/${id}`
  } as PageObjectResponse;
}

export function createMockTodoBlock (id: string, text: string, checked = false): ToDoBlockObjectResponse {
  return {
    id,
    object: 'block',
    type: 'to_do',
    created_time: '2024-01-01T00:00:00.000Z',
    last_edited_time: '2024-01-01T00:00:00.000Z',
    created_by: {
      object: 'user',
      id: 'user-id'
    },
    last_edited_by: {
      object: 'user',
      id: 'user-id'
    },
    has_children: false,
    archived: false,
    parent: {
      type: 'page_id',
      page_id: 'parent-page-id'
    },
    to_do: {
      rich_text: [{
        type: 'text',
        text: { content: text, link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        },
        plain_text: text,
        href: null
      }],
      checked,
      color: 'default'
    }
  } as ToDoBlockObjectResponse;
}

export function createMockParagraphBlock (id: string, text: string): BlockObjectResponse {
  return {
    id,
    object: 'block',
    type: 'paragraph',
    created_time: '2024-01-01T00:00:00.000Z',
    last_edited_time: '2024-01-01T00:00:00.000Z',
    created_by: {
      object: 'user',
      id: 'user-id'
    },
    last_edited_by: {
      object: 'user',
      id: 'user-id'
    },
    has_children: false,
    archived: false,
    parent: {
      type: 'page_id',
      page_id: 'parent-page-id'
    },
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: text, link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        },
        plain_text: text,
        href: null
      }],
      color: 'default'
    }
  } as BlockObjectResponse;
}

export function createMockDatabaseQueryResponse (
  pages: PageObjectResponse[],
  hasMore = false,
  nextCursor?: string
): QueryDatabaseResponse {
  return {
    object: 'list',
    results: pages,
    has_more: hasMore,
    next_cursor: nextCursor || null,
    type: 'page_or_database',
    page_or_database: {}
  } as QueryDatabaseResponse;
}

export function createMockBlockListResponse (
  blocks: BlockObjectResponse[],
  hasMore = false,
  nextCursor?: string
): ListBlockChildrenResponse {
  return {
    object: 'list',
    results: blocks,
    has_more: hasMore,
    next_cursor: nextCursor || null,
    type: 'block',
    block: {}
  } as ListBlockChildrenResponse;
}

export function createMockNotionClient () {
  const mockClient = {
    databases: {
      query: vi.fn()
    },
    blocks: {
      children: {
        list: vi.fn()
      }
    }
  };

  return mockClient;
}
