export type SubscriptionTier = 'free' | 'pro' | 'max';

export interface SubscriptionLimits {
  maxPages: number | undefined;
  maxCheckboxesPerPage: number | undefined;
  maxTodoLists: number;
  features: {
    notionSync: boolean;
    webhooks: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
  };
}

const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxPages: 10,
    maxCheckboxesPerPage: 50,
    maxTodoLists: 3,
    features: {
      notionSync: false,
      webhooks: false,
      prioritySupport: false,
      apiAccess: false
    }
  },
  pro: {
    maxPages: 100,
    maxCheckboxesPerPage: 200,
    maxTodoLists: -1, // unlimited
    features: {
      notionSync: true,
      webhooks: true,
      prioritySupport: true,
      apiAccess: false
    }
  },
  max: {
    maxPages: undefined, // unlimited
    maxCheckboxesPerPage: undefined, // unlimited
    maxTodoLists: -1, // unlimited
    features: {
      notionSync: true,
      webhooks: true,
      prioritySupport: true,
      apiAccess: true
    }
  }
};

export const useSubscription = () => {
  // Fetch subscription data from API
  const { data: subscriptionData, refresh } = useFetch('/api/subscription', {
    default: () => ({ tier: 'free' as SubscriptionTier, status: 'active' })
  });

  const currentTier = computed(() => subscriptionData.value?.tier || 'free');
  const limits = computed(() => SUBSCRIPTION_TIERS[currentTier.value]);

  const canAccessFeature = (feature: keyof SubscriptionLimits['features']) => {
    return limits.value.features[feature];
  };

  const isWithinLimits = (resource: 'pages' | 'checkboxes' | 'todoLists', count: number) => {
    switch (resource) {
      case 'pages':
        return limits.value.maxPages === undefined || count <= limits.value.maxPages;
      case 'checkboxes':
        return limits.value.maxCheckboxesPerPage === undefined || count <= limits.value.maxCheckboxesPerPage;
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
