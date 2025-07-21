import { TIER_LIMITS, type TierName } from '~/lib/pricing';
import type { SubscriptionTier } from '~/stores/subscription';

export interface SubscriptionLimits {
  maxPages: number;
  maxCheckboxesPerPage: number;
  maxTodoLists: number;
  features: {
    checkboxSync: boolean;
    syncFrequency: 'manual' | 'daily' | 'hourly';
    prioritySupport: boolean;
  };
}

const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    ...TIER_LIMITS.free,
    features: {
      checkboxSync: true,
      syncFrequency: 'manual',
      prioritySupport: false
    }
  },
  pro: {
    ...TIER_LIMITS.pro,
    features: {
      checkboxSync: true,
      syncFrequency: 'daily',
      prioritySupport: true
    }
  },
  max: {
    ...TIER_LIMITS.max,
    features: {
      checkboxSync: true,
      syncFrequency: 'hourly',
      prioritySupport: true
    }
  }
};

export const useSubscription = () => {
  // Fetch subscription data from API
  const { data: subscriptionResponse, refresh } = useFetch('/api/subscription', {
    default: () => ({ success: true, data: { tier: 'free' as SubscriptionTier, status: 'active' } })
  });

  // Extract subscription data from API response
  const subscriptionData = computed<{ tier: SubscriptionTier; status: string; hasStripeCustomer?: boolean }>(() => {
    const response = subscriptionResponse.value;
    if (!response) { return { tier: 'free', status: 'active' }; }
    if ('data' in response && response.data && 'tier' in response.data) {
      return response.data as { tier: SubscriptionTier; status: string; hasStripeCustomer?: boolean };
    }
    if ('tier' in response) {
      return response as unknown as { tier: SubscriptionTier; status: string; hasStripeCustomer?: boolean };
    }
    return { tier: 'free', status: 'active' };
  });
  const currentTier = computed(() => subscriptionData.value.tier);
  const limits = computed(() => SUBSCRIPTION_TIERS[currentTier.value]);

  const canAccessFeature = (feature: keyof SubscriptionLimits['features']) => {
    return limits.value.features[feature];
  };

  const isWithinLimits = (resource: 'pages' | 'checkboxes' | 'todoLists', count: number) => {
    switch (resource) {
      case 'pages':
        return count <= limits.value.maxPages;
      case 'checkboxes':
        return count <= limits.value.maxCheckboxesPerPage;
      case 'todoLists':
        return limits.value.maxTodoLists === -1 || count <= limits.value.maxTodoLists;
      default:
        return false;
    }
  };

  // Navigate to pricing page for upgrades
  const upgradeTier = async () => {
    await navigateTo('/pricing');
  };

  return {
    currentTier: readonly(currentTier),
    limits: readonly(limits),
    canAccessFeature,
    isWithinLimits,
    upgradeTier,
    refreshSubscription: refresh,
    SUBSCRIPTION_TIERS
  };
};
