# TypeScript Setup

Documentation for TypeScript configuration and setup in Checkify.so.

## Configuration Files

### tsconfig.json

The project uses a minimal TypeScript configuration that extends Nuxt's auto-generated config:

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

This approach ensures:
- Automatic path aliases based on Nuxt directory structure
- Proper Vue component type support
- Nuxt-specific type definitions

### shims-vue.d.ts

Provides type declarations for Vue components:

```typescript
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

This file ensures:
- Proper type inference for `.vue` files
- TypeScript recognizes Vue components
- IDE support for component imports

## Type Definitions

### API Response Types

Located in `lib/api-response.ts`:

```typescript
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
}
```

### Model Types

Located in `types/models.ts`:
- `User` - User account data
- `UserProfile` - Subscription and billing data
- `Subscription` - Detailed subscription information
- `TodoList` - Todo list metadata
- `Todo` - Individual todo items

## Common Type Issues and Solutions

### 1. Stripe API Type Assertions

Due to Stripe's dynamic API structure, use type assertions for certain properties:

```typescript
// Example from webhook handler
const currentPeriodEnd = 'current_period_end' in subscription && subscription.current_period_end
  ? new Date((subscription as any).current_period_end * 1000).toISOString()
  : null;
```

### 2. API Response Type Narrowing

When handling API responses with multiple possible formats:

```typescript
const subscriptionData = computed<{ tier: SubscriptionTier; status: string }>(() => {
  const response = subscriptionResponse.value;
  if (!response) return { tier: 'free', status: 'active' };
  
  // Type narrowing for different response formats
  if ('data' in response && response.data && 'tier' in response.data) {
    return response.data as { tier: SubscriptionTier; status: string };
  }
  
  if ('tier' in response) {
    return response as unknown as { tier: SubscriptionTier; status: string };
  }
  
  return { tier: 'free', status: 'active' };
});
```

### 3. Store Type Safety

Pinia stores use TypeScript for type safety:

```typescript
export const useSubscriptionStore = defineStore('subscription', () => {
  // Ref types
  const subscription = ref<Subscription | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // Computed with explicit return types
  const tier = computed((): SubscriptionTier => {
    return subscription.value?.tier || 'free';
  });
  
  // Actions with parameter types
  const setSubscription = (sub: Subscription | null) => {
    subscription.value = sub;
  };
  
  return {
    subscription: readonly(subscription),
    isLoading: readonly(isLoading),
    error: readonly(error),
    tier,
    setSubscription
  };
});
```

## Best Practices

### 1. Explicit Return Types

Always specify return types for computed properties and functions:

```typescript
// Good
const isProUser = computed((): boolean => {
  return tier.value === 'pro';
});

// Avoid
const isProUser = computed(() => {
  return tier.value === 'pro';
});
```

### 2. Type Guards

Use type guards for runtime type checking:

```typescript
function isSubscription(data: any): data is Subscription {
  return data &&
    typeof data.tier === 'string' &&
    typeof data.status === 'string';
}
```

### 3. Avoid `any` Type

Use `unknown` instead of `any` when type is truly unknown:

```typescript
// Good
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}

// Avoid
catch (error: any) {
  console.log(error.message); // No type safety
}
```

### 4. Utility Types

Use TypeScript utility types effectively:

```typescript
// Partial for optional updates
type UserProfileUpdate = Partial<UserProfile>;

// Pick for subset of properties
type UserBasicInfo = Pick<User, 'id' | 'email'>;

// Readonly for immutable data
type ReadonlySubscription = Readonly<Subscription>;
```

## IDE Configuration

### VS Code Settings

Recommended `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Type Checking Commands

```bash
# Run type checking
pnpm typecheck

# Watch mode for development
pnpm typecheck --watch
```

## Migration Guide

When adding TypeScript to existing JavaScript files:

1. Rename `.js` to `.ts` (or `.vue` components already have TS support)
2. Add type annotations gradually
3. Use JSDoc comments for gradual migration
4. Enable strict mode incrementally

Example migration:

```javascript
// Before (JavaScript)
export function calculatePrice(tier, annual) {
  const prices = { pro: 6.99, max: 19.99 };
  return annual ? prices[tier] * 12 * 0.9 : prices[tier];
}
```

```typescript
// After (TypeScript)
type PricingTier = 'pro' | 'max';

export function calculatePrice(tier: PricingTier, annual: boolean): number {
  const prices: Record<PricingTier, number> = { 
    pro: 6.99, 
    max: 19.99 
  };
  return annual ? prices[tier] * 12 * 0.9 : prices[tier];
}
```