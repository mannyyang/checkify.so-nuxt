-- Add columns for extraction metadata and sync information to todo_list table
ALTER TABLE public.todo_list
ADD COLUMN IF NOT EXISTS extraction_metadata JSONB,
ADD COLUMN IF NOT EXISTS notion_sync_database_id TEXT,
ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_todo_list_sync_database_id ON public.todo_list(notion_sync_database_id);
CREATE INDEX IF NOT EXISTS idx_todo_list_last_sync_date ON public.todo_list(last_sync_date);

-- Add comment to explain the extraction_metadata structure
COMMENT ON COLUMN public.todo_list.extraction_metadata IS 'Stores extraction info: {totalPages, totalCheckboxes, pagesWithCheckboxes, extractionComplete, errors, limits: {tier, maxPages, maxCheckboxesPerPage, pagesLimited, reachedPageLimit}}';