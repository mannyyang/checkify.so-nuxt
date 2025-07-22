# Database Migration Instructions

To add the new columns for extraction metadata and sync information, run the following SQL in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
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
```

## What this migration does:

1. **extraction_metadata** (JSONB): Stores information about the todo extraction process including:
   - totalPages: Number of pages in the Notion database
   - totalCheckboxes: Total number of todos found
   - pagesWithCheckboxes: Number of pages that contain todos
   - extractionComplete: Whether all data was extracted successfully
   - errors: Any errors encountered during extraction
   - limits: Information about tier limits and whether they were reached

2. **notion_sync_database_id** (TEXT): The ID of the Notion database created for syncing todos

3. **last_sync_date** (TIMESTAMP WITH TIME ZONE): When the todos were last synced to Notion

The indexes help with performance when querying by sync database ID or sync date.