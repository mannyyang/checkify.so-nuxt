# Setting Up Notion Webhooks for Bidirectional Sync

## Overview
To enable bidirectional sync (so changes in the Notion database update the original checkboxes), you need to set up a webhook in your Notion integration.

## Prerequisites
1. Your Checkify instance must be publicly accessible (not localhost)
2. You need access to your Notion integration settings
3. The database migration for webhook support must be applied

## Setup Steps

### 1. Get Your Webhook URL
Your webhook URL will be:
```
https://your-checkify-domain.com/api/notion-webhook
```

### 2. Configure Webhook in Notion

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Select your Checkify integration
3. Navigate to the "Webhooks" tab
4. Click "Add webhook endpoint"
5. Enter your webhook URL
6. Select these event types:
   - `page.updated` - To track checkbox status changes

### 3. Verify the Webhook
When you add the webhook, Notion will send a verification request. The endpoint will automatically handle this and respond appropriately.

### 4. Test the Integration
1. Sync your todos to a Notion database using the sync button
2. In the synced Notion database, check/uncheck a Status checkbox
3. Wait a moment (webhooks can take up to a minute)
4. Refresh your Checkify page - the original checkbox should reflect the change

## How It Works

1. **During Sync**: Checkify creates a mapping between each synced page and its original checkbox block
2. **On Update**: When you change a checkbox in the Notion database, Notion sends a webhook
3. **Processing**: The webhook handler:
   - Identifies which original checkbox the update refers to
   - Fetches the current status from the synced page
   - Updates the original checkbox block to match

## Troubleshooting

### Webhook Not Working
- Ensure your Checkify instance is publicly accessible
- Check the webhook status in Notion integration settings
- Look for errors in your server logs

### Updates Not Reflecting
- Webhooks can take up to 60 seconds to deliver
- Ensure the page has a "Block ID" property that matches the original
- Check that the integration has access to both databases

### Security Notes
- The webhook endpoint validates that updates are for tracked pages only
- Each webhook event is logged for debugging
- Consider implementing webhook signature validation for production use