# Subscription Tiers

Checkify.so offers flexible pricing tiers to match your todo management needs.

## Tier Comparison

| Feature | Free | Pro ($6.99/mo) | Max ($19.99/mo) |
|---------|------|----------------|------------------|
| **Pages per Database** | 25 | 100 | 500 |
| **Checkboxes per Page** | 25 | 100 | 1000 |
| **Todo Lists** | 2 | 10 | 25 |
| **Notion Sync** | ✅ | ✅ | ✅ |
| **Sync Checkboxes to Notion Database** | ✅ | ✅ | ✅ |
| **Automatic Sync** | ❌ | Daily | Hourly |
| **Support** | Basic | Priority | Priority Email |

## Free Tier

Perfect for personal use and trying out Checkify.

### Limits
- **25 pages** per Notion database
- **25 checkboxes** per page
- **2 todo lists** maximum
- **Basic support** only
- **Manual sync** only

### Use Cases
- Personal task management
- Small projects
- Testing the platform

### Implementation Note
When a free user reaches their limits, they'll see upgrade prompts in the UI.

## Pro Tier

Ideal for power users and professionals.

### Limits
- **100 pages** per Notion database
- **100 checkboxes** per page
- **10 todo lists** maximum
- **Daily automatic sync**

### Additional Features
- Email support
- No limits on database connections
- All core features included

### Use Cases
- Project management
- Team collaboration
- Content planning
- Large personal databases

## Max Tier

Built for power users and teams who need the highest limits.

### Limits
- **500 pages** per Notion database
- **1000 checkboxes** per page
- **25 todo lists** maximum
- **Hourly automatic sync**
- **All features included**

### Additional Features
- Everything in Pro tier
- Priority email support
- Highest performance tier
- Maximum limits for power users

### Use Cases
- Large teams
- Content creators with extensive databases
- Project managers with complex workflows
- Organizations with high-volume task management

## Automatic Sync Feature

### Overview
Checkify.so offers automatic synchronization with Notion based on your subscription tier:

- **Free Tier**: Manual sync only - click the sync button when you want to update
- **Pro Tier**: Daily automatic sync - todos refresh once every 24 hours
- **Max Tier**: Hourly automatic sync - todos refresh every hour

### How It Works
1. **Background Processing**: Sync happens automatically in the background
2. **Smart Updates**: Only changed items are updated to minimize API calls
3. **Notification**: You'll see a sync status indicator when updates occur
4. **Manual Override**: You can always trigger a manual sync regardless of tier

### Sync Schedule
- **Daily Sync (Pro)**: Runs at midnight UTC
- **Hourly Sync (Max)**: Runs at the top of each hour
- **Manual Sync**: Available anytime via the sync button

## Sync Checkboxes to Notion Database

### Overview
All tiers can use the "Sync to Notion Database" feature, which creates a centralized Notion database containing all your todos from across different pages.

### Features
- **Unified View**: All todos from selected pages in one database
- **Metadata Preservation**: Maintains links to original pages and blocks
- **Status Tracking**: Checkbox states sync to the database
- **Webhook Support**: Configure webhooks for bidirectional sync

### How to Use
1. Click "Sync to Notion Database" in your todo list
2. Choose a parent page (optional)
3. The system creates/updates a Notion database with all your todos
4. Each todo becomes a database entry with properties:
   - Title (the todo text)
   - Status (checked/unchecked)
   - Page (source page name)
   - Page Link (direct link to source)
   - Block Link (direct link to the todo)
   - Last Updated (sync timestamp)

### Webhook Integration
For advanced users, configure a webhook URL to receive updates when todos change:
1. Set up a webhook endpoint (e.g., using Zapier, Make, or custom API)
2. Add the webhook URL in todo list settings
3. Checkbox changes will POST to your webhook with todo metadata
4. Enable custom automations and integrations

## How Limits Work

### Extraction Process
When fetching todos from Notion:
1. Pages are fetched up to your tier limit
2. Checkboxes are extracted up to your tier limit per page
3. Clear feedback shows if limits were reached
4. Upgrade prompts appear for free users

### Enforcement
- Limits are applied at the API level
- Real-time feedback in the UI
- No data loss - just limited visibility
- Instant access to more data upon upgrade

### Testing Tiers
During development, you can test different tiers by adding a query parameter:
- `?tier=free` - Test free tier limits
- `?tier=pro` - Test pro tier limits
- `?tier=max` - Test max tier limits

## Implementation Details

### Composable
```typescript
import { useSubscription } from '~/composables/useSubscription';

const { currentTier, limits, canAccessFeature } = useSubscription();

// Check if user can access a feature
if (canAccessFeature('notionSync')) {
  // Show sync button
}

// Check if within limits
if (isWithinLimits('pages', 50)) {
  // Allow creation
}
```

### API Configuration
```typescript
const TIER_LIMITS = {
  free: {
    maxPages: 15,
    maxCheckboxesPerPage: 25,
    maxTodoLists: 2
  },
  pro: {
    maxPages: 100,
    maxCheckboxesPerPage: 100,
    maxTodoLists: 10
  },
  max: {
    maxPages: 500,
    maxCheckboxesPerPage: 1000,
    maxTodoLists: 25
  }
};
```

## Future Enhancements

### Recently Implemented
- ✅ Stripe payment integration
- ✅ Subscription management portal
- ✅ Automatic tier enforcement
- ✅ Webhook-based subscription sync
- ✅ Sync to Notion Database feature
- ✅ Webhook integration for bidirectional sync
- ✅ Daily/hourly automatic sync for paid tiers

### Planned Features
- Usage analytics dashboard
- Team collaboration features
- Advanced filtering options
- Custom integrations API
- Real-time collaborative editing
- Mobile app with offline support

### Pricing Adjustments
- Annual billing discounts (coming soon)
- Student/nonprofit pricing
- Volume discounts for teams
- Custom enterprise agreements