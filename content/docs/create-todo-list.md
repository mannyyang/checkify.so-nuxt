---
title: 'Create a To-do List'
icon: 'key'
---

After connecting Notion to Checkify.so, the next step is to create a to-do list
by using a database in your Notion account. Here's a step-by-step guide:

1. On the same page where you connected Notion to Checkify.so, search and select
   the database that you want to extract all your checkboxes from.

![Checkify.so Database](/docs/database-notion.png)

> **NOTE**
>
> If your database does not show up in the selection panel, it might be because
> it is still being synced. Wait for 1-2 minutes and search again.

2. A new item will appear in the panel labeled "My Todo Lists" below the search
   bar. Click the copy button to copy URL you'll use for the embed.

![Checkify.so Copy Embed Link](/docs/copy-embed-link.png)

3. Once you've copied the link, go to your Notion page and paste the link as an
   embed. 

![Checkify.so Embed View](/docs/embed-view.png)

4. And that's it! You should now see your to-do list in your Notion page.

## Understanding Extraction Results

When you create a todo list, Checkify extracts all checkboxes from your selected database. You'll see:

- **Total Pages Processed**: Number of pages scanned in your database
- **Total Checkboxes Found**: All checkbox items discovered
- **Pages with Todos**: Pages that actually contain checkboxes

## Subscription Tier Limits

Depending on your subscription tier, there are limits to how many items you can track:

### Free Tier
- **25 pages** maximum per database
- **25 checkboxes** per page
- **2 todo lists** total

### Pro Tier ($6.99/mo)
- **100 pages** maximum per database
- **100 checkboxes** per page
- **10 todo lists** total

### Max Tier ($19.99/mo)
- **500 pages** maximum per database
- **1000 checkboxes** per page
- **25 todo lists** total

If you reach your tier limits, you'll see a clear indicator showing how many items were processed versus the limit.

## Features After Creating a Todo List

### Real-time Sync
Click any checkbox in Checkify and it instantly updates in your Notion page.

### Sync to Notion Database
Create a centralized Notion database containing all your todos:
1. Click the "Sync to Notion" button on your todo list
2. A new database is created with all your todos
3. Each todo includes links back to the original page

See the [Sync to Notion guide](/docs/sync-to-notion) for details.

### Manual Refresh
Click the refresh button to fetch the latest todos from Notion if changes were made outside Checkify.