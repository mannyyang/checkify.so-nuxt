---
title: 'Sync to Notion Database'
icon: 'database'
---

The Sync to Notion feature creates a centralized Notion database that aggregates all your todos from various pages into one organized view. This solves the common problem of having todos scattered across different Notion pages.

## How It Works

When you click "Sync to Notion" on your todo list, Checkify:

1. Creates a new Notion database (or updates an existing one)
2. Adds all your todos as database entries
3. Includes metadata and links back to original pages
4. Maintains the checkbox state for each todo

## Step-by-Step Guide

### 1. Open Your Todo List
Navigate to your todo list in Checkify that you want to sync.

### 2. Click "Sync to Notion"
Look for the "Sync to Notion" button on your todo list page.

![Sync to Notion Button](/docs/sync-to-notion-button.png)

### 3. Wait for Sync to Complete
The sync process will:
- Create a new database in your Notion workspace
- Add each todo as a database entry
- Show progress as it processes

### 4. View Your Synced Database
Once complete, you'll receive a link to your new Notion database. Click to open it in Notion.

## Database Structure

The synced database includes these properties for each todo:

| Property | Type | Description |
|----------|------|-------------|
| **Title** | Title | The todo text |
| **Status** | Checkbox | Whether the todo is completed |
| **Page** | Text | The name of the page containing the todo |
| **Page Link** | URL | Direct link to the source page |
| **Block Link** | URL | Direct link to the specific todo block |
| **Last Updated** | Last edited time | When the todo was last synced |
| **Block ID** | Text | The original block ID for reference |

## Using Your Synced Database

### Organize Your Todos
- **Filter by Status**: Show only incomplete tasks
- **Group by Page**: See todos organized by their source
- **Sort by Date**: Find recently updated todos
- **Create Views**: Build custom views for different contexts

### Important Notes

1. **One-Way Sync**: Changes in the synced database don't update the original todos
2. **Manual Updates**: Click "Sync to Notion" again to refresh with latest todos
3. **Persistent Database**: The same database is reused for subsequent syncs
4. **Tier Limits Apply**: The number of todos synced depends on your subscription tier

## Benefits

- **Centralized View**: All todos from multiple pages in one place
- **Better Organization**: Use Notion's database features to organize todos
- **Context Preservation**: Links maintain connection to original content
- **Project Overview**: See all project todos at a glance

## Troubleshooting

### "Failed to create database"
- Ensure Checkify has permission to create content in your workspace
- Try disconnecting and reconnecting Notion

### "Some todos were skipped"
- Check if you've reached your tier limits
- Deleted todos from source pages won't appear

### "Can't find my synced database"
- Check your Notion workspace root
- Look for a database named "Checkify Todos"
- The database link is saved in your todo list settings

## Coming Soon

- **Webhook Integration**: Real-time bidirectional sync (planned)
- **Custom Properties**: Add your own fields to the synced database
- **Automated Sync**: Daily/hourly automatic updates for Pro/Max users