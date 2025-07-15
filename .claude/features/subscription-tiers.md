# Subscription Tiers

Checkify.so offers flexible pricing tiers to match your todo management needs.

## Tier Comparison

| Feature | Free | Pro ($9/mo) | Enterprise ($29/mo) |
|---------|------|-------------|-------------------|
| **Pages per Database** | 10 | 100 | Unlimited |
| **Checkboxes per Page** | 50 | 200 | Unlimited |
| **Todo Lists** | 3 | Unlimited | Unlimited |
| **Sync Frequency** | 60 min | 15 min | 5 min |
| **Notion Database Sync** | ❌ | ✅ | ✅ |
| **Webhook Support** | ❌ | ✅ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **Team Features** | ❌ | ❌ | ✅ |

## Free Tier

Perfect for personal use and trying out Checkify.

### Limits
- **10 pages** per Notion database
- **50 checkboxes** per page
- **3 todo lists** maximum
- **Basic features** only

### Use Cases
- Personal task management
- Small projects
- Testing the platform

## Pro Tier

Ideal for power users and professionals.

### Limits
- **100 pages** per Notion database
- **200 checkboxes** per page
- **Unlimited todo lists**
- **All features** except API access

### Additional Features
- Notion database sync (export todos)
- Webhook support for bidirectional sync
- Priority email support
- Advanced filters and sorting
- Faster sync frequency (15 minutes)

### Use Cases
- Project management
- Team collaboration
- Content planning
- Large personal databases

## Enterprise Tier

Built for teams and organizations.

### Limits
- **Unlimited pages**
- **Unlimited checkboxes**
- **Unlimited todo lists**
- **All features included**

### Additional Features
- Everything in Pro tier
- API access for custom integrations
- Real-time sync (5 minutes)
- Multiple team members
- Shared todo lists
- Custom branding (coming soon)
- Dedicated support

### Use Cases
- Large teams
- Multiple departments
- Custom workflows
- Enterprise integration

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
- `?tier=enterprise` - Test unlimited access

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
    maxPages: 10,
    maxCheckboxesPerPage: 50
  },
  pro: {
    maxPages: 100,
    maxCheckboxesPerPage: 200
  },
  enterprise: {
    maxPages: undefined, // unlimited
    maxCheckboxesPerPage: undefined
  }
};
```

## Future Enhancements

### Planned Features
- Stripe payment integration
- Usage analytics dashboard
- Granular permissions
- Custom limit configurations
- Team billing management

### Pricing Adjustments
- Annual billing discounts
- Student/nonprofit pricing
- Volume discounts for enterprise
- Custom enterprise agreements