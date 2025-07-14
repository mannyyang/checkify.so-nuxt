-- Create table to track synced pages and their original checkbox blocks
CREATE TABLE IF NOT EXISTS notion_sync_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_list_id UUID NOT NULL REFERENCES todo_list(todo_list_id) ON DELETE CASCADE,
  sync_database_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sync_pages_page_id ON notion_sync_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_sync_pages_todo_list ON notion_sync_pages(todo_list_id);

-- Add webhook URL column to todo_list table
ALTER TABLE todo_list
ADD COLUMN IF NOT EXISTS webhook_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Add comments for documentation
COMMENT ON TABLE notion_sync_pages IS 'Maps synced Notion database pages back to their original checkbox blocks';
COMMENT ON COLUMN notion_sync_pages.page_id IS 'Notion page ID in the synced database';
COMMENT ON COLUMN notion_sync_pages.block_id IS 'Original checkbox block ID';
COMMENT ON COLUMN todo_list.webhook_id IS 'Notion webhook subscription ID';
COMMENT ON COLUMN todo_list.webhook_url IS 'URL where Notion sends webhook events';
COMMENT ON COLUMN todo_list.webhook_secret IS 'Secret for webhook payload validation';