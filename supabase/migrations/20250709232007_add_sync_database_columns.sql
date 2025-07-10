-- Add columns to support Notion sync database feature
ALTER TABLE todo_list
ADD COLUMN IF NOT EXISTS notion_sync_database_id TEXT,
ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_todo_list_sync_database 
ON todo_list(notion_sync_database_id) 
WHERE notion_sync_database_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN todo_list.notion_sync_database_id IS 'ID of the Notion database created for syncing aggregated todos';
COMMENT ON COLUMN todo_list.last_sync_date IS 'Timestamp of the last successful sync to Notion';