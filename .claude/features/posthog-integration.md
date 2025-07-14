# PostHog Integration

## Overview

Checkify.so uses PostHog for analytics and feature flag management. This enables controlled feature rollouts, user behavior tracking, and data-driven decision making.

## Setup

### Installation

PostHog is installed as a client-side plugin:

```bash
pnpm add posthog-js
```

### Configuration

The PostHog client is initialized in `plugins/posthog.client.ts`:

```typescript
import posthogLib from 'posthog-js';

export default defineNuxtPlugin(() => {
  if (typeof window !== 'undefined') {
    posthogLib.init('phc_BIxmZZkq3eZnFe34blKaxY9s6XG90vXv0AcoIqKGBia', {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      loaded: () => {
        // PostHog loaded successfully
      }
    });
  }

  return {
    provide: {
      posthog: posthogLib
    }
  };
});
```

### Composable

A composable is provided for easy access throughout the application:

```typescript
// composables/usePostHog.ts
export const usePostHog = () => {
  const { $posthog } = useNuxtApp();
  return $posthog;
};
```

## User Identification

Users are automatically identified when they authenticate. This happens in `app.vue`:

```typescript
const user = useSupabaseUser();
const posthog = usePostHog();

onMounted(() => {
  if (user.value) {
    posthog.identify(user.value.id, {
      email: user.value.email
    });
  }
});

watch(user, (newUser) => {
  if (newUser) {
    posthog.identify(newUser.id, {
      email: newUser.email
    });
  } else {
    posthog.reset();
  }
});
```

## Feature Flags

### Available Flags

- **`notion-database-sync`**: Controls the visibility of the Notion database sync feature

### Using Feature Flags

```typescript
const posthog = usePostHog();

// Check if a feature is enabled
const isFeatureEnabled = posthog.isFeatureEnabled('notion-database-sync');

// Wait for flags to load
onMounted(() => {
  posthog.onFeatureFlags(() => {
    const isSyncEnabled = posthog.isFeatureEnabled('notion-database-sync');
    // Use the flag value
  });
});
```

### Implementation Example

The Notion sync feature is hidden behind a feature flag:

```vue
<template>
  <Card v-if="isNotionSyncEnabled" class="sync-card">
    <!-- Sync UI -->
  </Card>
</template>

<script setup>
const posthog = usePostHog();
const isNotionSyncEnabled = ref(false);

onMounted(() => {
  isNotionSyncEnabled.value = posthog.isFeatureEnabled('notion-database-sync') || false;
  
  posthog.onFeatureFlags(() => {
    isNotionSyncEnabled.value = posthog.isFeatureEnabled('notion-database-sync') || false;
  });
});
</script>
```

## Analytics Events

### Automatic Events

PostHog automatically tracks:
- Page views
- User sessions
- Click events (with autocapture)

### Custom Events

Track custom events for specific user actions:

```typescript
const posthog = usePostHog();

// Track an event
posthog.capture('todo_checked', {
  todo_id: checkbox.id,
  page_id: page.id,
  checked: checkbox.to_do.checked
});

// Track sync events
posthog.capture('notion_sync_started', {
  todo_list_id: todoListId,
  total_todos: todoCount
});

posthog.capture('notion_sync_completed', {
  todo_list_id: todoListId,
  created: syncResults.created,
  updated: syncResults.updated,
  duration: endTime - startTime
});
```

## Best Practices

### 1. Feature Flag Loading

Always handle the async nature of feature flags:

```typescript
// ❌ Bad - May return undefined
const isEnabled = posthog.isFeatureEnabled('my-flag');

// ✅ Good - Handle loading state
const isEnabled = ref(false);
onMounted(() => {
  posthog.onFeatureFlags(() => {
    isEnabled.value = posthog.isFeatureEnabled('my-flag') || false;
  });
});
```

### 2. User Privacy

- Only identify users after they've authenticated
- Use `person_profiles: 'identified_only'` to avoid tracking anonymous users
- Reset the session when users log out

### 3. Event Naming

Use consistent, descriptive event names:
- Use snake_case for event names
- Include context (e.g., `todo_checked` not just `checked`)
- Group related events (e.g., `sync_started`, `sync_completed`)

### 4. Property Names

Keep event properties consistent:
- Use camelCase for property names
- Include relevant IDs for debugging
- Add timestamps for time-based analysis

## Dashboard Configuration

In the PostHog dashboard:

1. **Feature Flags**:
   - Create flags with percentage rollouts
   - Target specific users or groups
   - Use payload for configuration

2. **Insights**:
   - Create funnels for user journeys
   - Track feature adoption rates
   - Monitor performance metrics

3. **Cohorts**:
   - Segment users by behavior
   - Create targeted feature rollouts
   - Analyze user patterns

## Troubleshooting

### Feature Flags Not Loading

1. Check browser console for errors
2. Verify PostHog is initialized
3. Ensure user is identified
4. Check flag exists in PostHog dashboard

### Events Not Tracking

1. Verify PostHog is loaded
2. Check network tab for requests
3. Ensure event names are valid
4. Verify properties are serializable

### User Not Identified

1. Check authentication state
2. Verify identify() is called
3. Check user ID format
4. Ensure email is available