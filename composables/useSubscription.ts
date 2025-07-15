export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

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
  enterprise: {
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
  // TODO: This should fetch from Supabase/Stripe
  // For now, we'll use a reactive state that can be updated
  const currentTier = useState<SubscriptionTier>('subscription-tier', () => 'free');

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

  // Mock function to upgrade tier (would connect to Stripe)
  const upgradeTier = async (newTier: SubscriptionTier) => {
    // TODO: Process payment through Stripe
    // For now, just update the tier
    currentTier.value = newTier;
  };

  return {
    currentTier: readonly(currentTier),
    limits: readonly(limits),
    canAccessFeature,
    isWithinLimits,
    upgradeTier,
    SUBSCRIPTION_TIERS
  };
};
