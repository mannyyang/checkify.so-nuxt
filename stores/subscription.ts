import { defineStore } from 'pinia';

export type SubscriptionTier = 'free' | 'pro' | 'max'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing'

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at?: string
  ended_at?: string
  trial_end?: string
  created_at: string
  updated_at: string
}

export interface TierLimits {
  tier: SubscriptionTier
  notionDatabases: number
  todosPerDatabase: number
  refreshInterval: number
  supportPriority: string
  price: number
  features: string[]
}

interface SubscriptionState {
  subscription: Subscription | null
  limits: TierLimits | null
  isLoading: boolean
  isSyncing: boolean
  error: string | null
}

const DEFAULT_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    tier: 'free',
    notionDatabases: 1,
    todosPerDatabase: 10,
    refreshInterval: 60, // minutes
    supportPriority: 'Community',
    price: 0,
    features: [
      '1 Notion database',
      '10 todos per database',
      '60-minute sync interval',
      'Community support'
    ]
  },
  pro: {
    tier: 'pro',
    notionDatabases: 5,
    todosPerDatabase: 100,
    refreshInterval: 5, // minutes
    supportPriority: 'Priority',
    price: 699, // $6.99 in cents
    features: [
      '5 Notion databases',
      '100 todos per database',
      '5-minute sync interval',
      'Priority support',
      'Advanced filters',
      'Custom tags'
    ]
  },
  max: {
    tier: 'max',
    notionDatabases: -1, // unlimited
    todosPerDatabase: -1, // unlimited
    refreshInterval: 1, // minute
    supportPriority: 'Premium',
    price: 1999, // $19.99 in cents
    features: [
      'Unlimited Notion databases',
      'Unlimited todos',
      'Real-time sync',
      'Premium support',
      'Advanced filters',
      'Custom tags',
      'Export capabilities',
      'API access'
    ]
  }
};

export const useSubscriptionStore = defineStore('subscription', {
  state: (): SubscriptionState => ({
    subscription: null,
    limits: DEFAULT_LIMITS.free,
    isLoading: false,
    isSyncing: false,
    error: null
  }),

  getters: {
    tier: (state): SubscriptionTier => state.subscription?.tier || 'free',
    isActive: state => state.subscription?.status === 'active',
    isPro: state => state.subscription?.tier === 'pro' && state.subscription?.status === 'active',
    isMax: state => state.subscription?.tier === 'max' && state.subscription?.status === 'active',
    canAddDatabase: (state) => {
      if (!state.limits) { return false; }
      return state.limits.notionDatabases === -1 || state.limits.notionDatabases > 0;
    },
    databaseLimit: state => state.limits?.notionDatabases || 1,
    todoLimit: state => state.limits?.todosPerDatabase || 10,
    features: state => state.limits?.features || DEFAULT_LIMITS.free.features
  },

  actions: {
    setSubscription (subscription: Subscription | null) {
      this.subscription = subscription;
      this.updateLimits();
    },

    updateLimits () {
      const tier = this.subscription?.tier || 'free';
      this.limits = DEFAULT_LIMITS[tier];
    },

    async fetchSubscription () {
      this.isLoading = true;
      this.error = null;

      try {
        const { data } = await $fetch('/api/subscription', {
          method: 'GET'
        });

        if (data?.subscription) {
          this.setSubscription(data.subscription);
        } else {
          this.setSubscription(null);
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to fetch subscription';
        console.error('Error fetching subscription:', error);
        // Default to free tier on error
        this.setSubscription(null);
      } finally {
        this.isLoading = false;
      }
    },

    async syncSubscription () {
      if (this.isSyncing) { return; }

      this.isSyncing = true;
      this.error = null;

      try {
        const { data } = await $fetch('/api/stripe/sync-subscription', {
          method: 'POST'
        });

        if (data?.subscription) {
          this.setSubscription(data.subscription);
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to sync subscription';
        console.error('Error syncing subscription:', error);
      } finally {
        this.isSyncing = false;
      }
    },

    async createCheckoutSession (tier: 'pro' | 'max') {
      try {
        const { data } = await $fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          body: { tier }
        });

        if (data?.url) {
          await navigateTo(data.url, { external: true });
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to create checkout session';
        throw error;
      }
    },

    async createPortalSession () {
      try {
        const { data } = await $fetch('/api/stripe/create-portal-session', {
          method: 'POST'
        });

        if (data?.url) {
          await navigateTo(data.url, { external: true });
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to create portal session';
        throw error;
      }
    },

    // Subscription management is now handled through Stripe Customer Portal
    // Use createPortalSession() to manage subscriptions

    reset () {
      this.subscription = null;
      this.limits = DEFAULT_LIMITS.free;
      this.isLoading = false;
      this.isSyncing = false;
      this.error = null;
    }
  }
});
