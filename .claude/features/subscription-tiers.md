# Subscription Tiers

Checkify.so offers flexible pricing tiers to match your todo management needs.

## Tier Comparison

| Feature | Free | Pro ($6.99/mo) | Max ($19.99/mo) |
|---------|------|----------------|------------------|
| **Pages per Database** | 25 | 100 | 500 |
| **Checkboxes per Page** | 25 | 100 | 1000 |
| **Todo Lists** | 2 | 10 | 25 |
| **Notion Sync** | ✅ | ✅ | ✅ |
| **Automatic Sync** | ❌ | Daily | Hourly |
| **Support** | Community | Email | Priority Email |

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
    maxPages: 25,
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

### Planned Features
- Usage analytics dashboard
- Team collaboration features
- Advanced filtering options
- Custom integrations API

### Pricing Adjustments
- Annual billing discounts (coming soon)
- Student/nonprofit pricing
- Volume discounts for teams
- Custom enterprise agreements