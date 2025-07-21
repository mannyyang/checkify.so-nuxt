import { Client } from '@notionhq/client';
import type {
  DatabaseObjectResponse,
  PageObjectResponse,
  CreateDatabaseResponse
} from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';
import { consola } from 'consola';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

interface SyncRequestBody {
  todo_list_id: string;
  parent_page_id?: string;
}

export default defineEventHandler(async (event) => {
  const { user, notion_auth: notionAuth } = event.context;
  const body: SyncRequestBody = await readBody(event);

  if (!body || !notionAuth) {
    throw new Error('No body or auth found');
  }

  const { todo_list_id: todoListId, parent_page_id: parentPageId } = body;

  // Get the todo list and its associated notion database
  const { data: todoListData, error: todoListError } = await supabase
    .from('todo_list')
    .select(`
      todo_list_id,
      notion_sync_database_id,
      notion_database_id(notion_database_id, access_token, metadata)
    `)
    .eq('todo_list_id', todoListId)
    .single();

  if (todoListError || !todoListData) {
    throw new Error('Todo list not found');
  }

  const { notion_database_id: notionDb, notion_sync_database_id: syncDatabaseId } = todoListData;
  
  // Check if we have a notion database connection
  // Supabase foreign key expansion returns an object, not an array
  if (!notionDb) {
    throw new Error('No Notion database connected to this todo list');
  }
  
  // Since it's a foreign key expansion, notionDb should be an object
  if (!notionDb.access_token) {
    throw new Error('No access token found for the Notion database');
  }
  
  // Use the access token from the linked notion database
  const notion = new Client({ auth: notionDb.access_token });

  // Get all checkboxes from the source database
  const databasePages = await notion.databases.query({
    database_id: notionDb.notion_database_id,
    page_size: 100
  });

  const pages = databasePages.results || [];

  // Collect all checkboxes
  const allCheckboxes = [];

  for (const pageBlock of pages) {
    const childrenBlocksResp = await notion.blocks.children.list({
      block_id: pageBlock.id,
      page_size: 100
    });

    const checkboxBlocks = childrenBlocksResp.results.filter((childBlock) => {
      // @ts-ignore
      return childBlock.type === 'to_do';
    });

    for (const checkbox of checkboxBlocks) {
      allCheckboxes.push({
        checkbox,
        page: pageBlock as PageObjectResponse
      });
    }
  }

  // Create or update the sync database
  let currentSyncDatabaseId = syncDatabaseId;
  
  if (!currentSyncDatabaseId) {
    // Create new database
    const rawPageId = parentPageId || notionDb.metadata?.parent?.page_id;

    if (!rawPageId) {
      throw new Error('No parent page ID provided for creating sync database');
    }
    
    // The frontend already extracts the page ID from URL, so we can use it directly
    const targetPageId = rawPageId;
    
    consola.info('Target page ID:', targetPageId);

    try {
      const newDatabase: CreateDatabaseResponse = await notion.databases.create({
        parent: {
          type: 'page_id',
          page_id: targetPageId
        },
        title: [
          {
            type: 'text',
            text: {
              content: 'Checkify Aggregated Todos'
            }
          }
        ],
        properties: {
          Title: {
            title: {}
          },
          Status: {
            checkbox: {}
          },
          Page: {
            rich_text: {}
          },
          'Page Link': {
            url: {}
          },
          'Block Link': {
            url: {}
          },
          'Last Updated': {
            date: {}
          },
          'Block ID': {
            rich_text: {}
          }
        }
      });

      currentSyncDatabaseId = newDatabase.id;

      // Store the sync database ID
      const { error: updateError } = await supabase
        .from('todo_list')
        .update({
          notion_sync_database_id: currentSyncDatabaseId,
          last_sync_date: new Date().toISOString()
        })
        .eq('todo_list_id', todoListId);

      if (updateError) {
        consola.error('Error updating todo list with sync database ID:', updateError);
      }
    } catch (error) {
      consola.error('Error creating sync database:', error);
      throw error;
    }
  }

  // Get existing pages in the sync database
  const existingPages = await notion.databases.query({
    database_id: currentSyncDatabaseId,
    page_size: 100
  });

  const existingBlockIds = new Map();
  for (const page of existingPages.results) {
    // @ts-ignore
    const blockId = page.properties['Block ID']?.rich_text?.[0]?.plain_text;
    if (blockId) {
      existingBlockIds.set(blockId, page.id);
    }
  }

  // Sync checkboxes to the database
  const syncResults = {
    created: 0,
    updated: 0,
    errors: [] as Array<{ blockId: string; error: string }>
  };

  // Track synced pages for webhook updates (disabled for now)
  // const syncedPages = [];

  for (const { checkbox, page } of allCheckboxes) {
    // @ts-ignore
    const checkboxData = checkbox;
    const blockId = checkboxData.id;
    const existingPageId = existingBlockIds.get(blockId);

    // @ts-ignore
    const pageName = page.properties.Name?.title?.[0]?.plain_text || 'Untitled';
    const pageUrl = `https://www.notion.so/${page.id.replace(/-/g, '')}`;
    const blockUrl = `${pageUrl}#${blockId.replace(/-/g, '')}`;

    const properties = {
      Title: {
        title: [
          {
            text: {
              content: 'to_do' in checkboxData && checkboxData.to_do ? (checkboxData as any).to_do.rich_text?.[0]?.plain_text || 'Untitled Todo' : 'Untitled Todo'
            }
          }
        ]
      },
      Status: {
        checkbox: 'to_do' in checkboxData && checkboxData.to_do ? (checkboxData as any).to_do.checked : false
      },
      Page: {
        rich_text: [
          {
            text: {
              content: pageName
            }
          }
        ]
      },
      'Page Link': {
        url: pageUrl
      },
      'Block Link': {
        url: blockUrl
      },
      'Last Updated': {
        date: {
          start: new Date().toISOString()
        }
      },
      'Block ID': {
        rich_text: [
          {
            text: {
              content: blockId
            }
          }
        ]
      }
    };

    try {
      let syncedPageId;

      if (existingPageId) {
        // Update existing page
        await notion.pages.update({
          page_id: existingPageId,
          properties
        });
        syncResults.updated++;
        syncedPageId = existingPageId;
      } else {
        // Create new page
        const newPage = await notion.pages.create({
          parent: {
            database_id: currentSyncDatabaseId
          },
          properties
        });
        syncResults.created++;
        syncedPageId = newPage.id;
      }

      // Track the synced page for webhook mapping (disabled for now)
      // syncedPages.push({
      //   todo_list_id: todoListId,
      //   sync_database_id: currentSyncDatabaseId,
      //   page_id: syncedPageId,
      //   block_id: blockId
      // });
    } catch (error: any) {
      consola.error(`Error syncing checkbox ${blockId}:`, error);
      syncResults.errors.push({
        blockId,
        error: error.message
      });
    }
  }

  // Store the page-to-block mappings (disabled for now)
  // if (syncedPages.length > 0) {
  //   const { error: mappingError } = await supabase
  //     .from('notion_sync_pages')
  //     .upsert(syncedPages, {
  //       onConflict: 'page_id'
  //     });

  //   if (mappingError) {
  //     consola.error('Error storing page mappings:', JSON.stringify(mappingError, null, 2));
  //     consola.error('Synced pages data:', JSON.stringify(syncedPages, null, 2));
  //   }
  // }

  // Update last sync date
  await supabase
    .from('todo_list')
    .update({
      last_sync_date: new Date().toISOString()
    })
    .eq('todo_list_id', todoListId);

  return {
    success: true,
    syncDatabaseId: currentSyncDatabaseId,
    syncResults,
    totalCheckboxes: allCheckboxes.length
  };
});
