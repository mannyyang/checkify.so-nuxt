<script setup lang="ts">
import { CreditCard, Loader2, Check, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { PRICING_TIERS, type TierName } from '~/lib/pricing';

definePageMeta({
  layout: 'default'
});

const user = useSupabaseUser();
const { data: subscriptionResponse, refresh: refreshSubscription, pending: subscriptionLoading } = await useFetch('/api/subscription');
const isLoadingPortal = ref(false);
const isRefreshing = ref(false);
const isUpgrading = ref(false);
const showDebug = ref(false);

// Get runtime config for Stripe price IDs
const config = useRuntimeConfig();

// Use shared pricing tiers with price IDs
const tiers = PRICING_TIERS.map(tier => ({
  ...tier,
  priceId: tier.id === 'pro'
    ? config.public.stripePriceIdPro
    : tier.id === 'max'
      ? config.public.stripePriceIdMax
      : undefined
}));

const subscription = computed(() => subscriptionResponse.value?.data || subscriptionResponse.value);
const currentTier = computed(() => subscription.value?.tier || 'free');
const hasActiveSubscription = computed(() =>
  subscription.value?.status === 'active' &&
  subscription.value?.tier !== 'free'
);

// Manual refresh function
async function manualRefresh () {
  isRefreshing.value = true;
  try {
    // Sync from Stripe first
    await $fetch('/api/stripe/sync-subscription', { method: 'POST' });
    await refreshSubscription();
    await refreshNuxtData();
    toast.success('Subscription data refreshed');
  } catch (error) {
    toast.error('Failed to refresh subscription data');
  } finally {
    isRefreshing.value = false;
  }
}

// Check for success from Stripe checkout
onMounted(() => {
  const route = useRoute();
  if (route.query.success === 'true') {
    const targetTier = route.query.tier as string;
    toast.success(`Processing your upgrade to the ${targetTier} plan...`);

    // Poll for subscription update with retry logic
    let retries = 0;
    const maxRetries = 10;
    const retryDelay = 1500; // 1.5 seconds between retries

    const checkSubscriptionUpdate = async () => {
      // Try to sync from Stripe first
      if (retries > 2) {
        try {
          await $fetch('/api/stripe/sync-subscription', { method: 'POST' });
        } catch (error) {
          // Failed to sync subscription
        }
      }

      await refreshSubscription();
      await refreshNuxtData();

      // Check if subscription was updated
      if (subscription.value?.tier === targetTier) {
        toast.success(`Successfully upgraded to ${targetTier} plan!`);
        // Clear query params
        navigateTo('/settings', { replace: true });
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(checkSubscriptionUpdate, retryDelay);
      } else {
        toast.error('Subscription update is taking longer than expected. Please refresh the page in a moment.');
        // Clear query params anyway
        navigateTo('/settings', { replace: true });
      }
    };

    // Start checking after initial delay for webhook
    setTimeout(checkSubscriptionUpdate, 2000);
  }
});

async function openBillingPortal () {
  if (!subscription.value?.hasStripeCustomer) {
    toast.error('No billing information found. Please upgrade to a paid plan first.');
    return;
  }

  isLoadingPortal.value = true;
  try {
    const data = await $fetch('/api/stripe/create-portal-session', {
      method: 'POST'
    });

    if (data?.data?.url) {
      window.location.href = data.data.url;
    }
  } catch (error) {
    toast.error('Failed to open billing portal. Please try again.');
  } finally {
    isLoadingPortal.value = false;
  }
}

const tierLabels = {
  free: 'Free',
  pro: 'Pro',
  max: 'Max'
};

const tierColors = {
  free: 'bg-gray-100 text-gray-800',
  pro: 'bg-blue-100 text-blue-800',
  max: 'bg-purple-100 text-purple-800'
};

// Handle initial subscription - redirect to Stripe checkout
async function handleInitialSubscription (tier: string, priceId?: string) {
  if (!priceId || tier === 'free') {
    return;
  }

  isUpgrading.value = true;
  try {
    // Use create checkout session for new subscriptions
    const data = await $fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        priceId,
        tier
      }
    });

    if (data?.data?.url) {
      window.location.href = data.data.url;
    } else {
      toast.error('Invalid response from server');
    }
  } catch (error: any) {
    const errorMessage = error.data?.statusMessage || 'Failed to process subscription. Please try again.';
    toast.error(errorMessage);
  } finally {
    isUpgrading.value = false;
  }
}

// Add debug data fetch function
async function fetchDebugData () {
  try {
    const debugData = await $fetch('/api/stripe/debug-subscription');
    alert(JSON.stringify(debugData, null, 2));
  } catch (error) {
    toast.error('Failed to fetch debug data');
  }
}
</script>

<template>
  <div class="container max-w-4xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-8">
      Settings
    </h1>

    <!-- Account Section -->
    <div class="bg-white rounded-lg border shadow-sm mb-6">
      <div class="p-6">
        <h2 class="text-xl font-semibold mb-4">
          Account
        </h2>
        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-600">Email</label>
            <p class="font-medium">
              {{ user?.email }}
            </p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Name</label>
            <p class="font-medium">
              {{ user?.user_metadata?.full_name || 'Not set' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Billing Section -->
    <div class="bg-white rounded-lg border shadow-sm">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            Billing & Subscription
          </h2>
          <div class="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              :disabled="isRefreshing"
              @click="manualRefresh"
            >
              <Loader2 v-if="isRefreshing" class="w-4 h-4 animate-spin" />
              <span v-else>↻</span>
            </Button>
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                tierColors[subscription?.tier as keyof typeof tierColors || 'free']
              ]"
            >
              {{ tierLabels[subscription?.tier as keyof typeof tierLabels || 'free'] }} Plan
            </span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-600">Current Plan</label>
            <p class="font-medium">
              {{ tierLabels[subscription?.tier as keyof typeof tierLabels || 'free'] }}
              <span v-if="subscription?.tier === 'free'">- $0/month</span>
              <span v-else-if="subscription?.tier === 'pro'">- $6.99/month</span>
              <span v-else-if="subscription?.tier === 'max'">- $19.99/month</span>
            </p>
          </div>

          <div v-if="subscription?.expiresAt" class="text-sm text-amber-600">
            Your subscription will expire on {{ new Date(subscription.expiresAt).toLocaleDateString() }}
          </div>

          <div class="flex gap-3 pt-2">
            <Button
              v-if="subscription?.hasStripeCustomer"
              :disabled="isLoadingPortal"
              variant="outline"
              @click="openBillingPortal"
            >
              <CreditCard class="w-4 h-4 mr-2" />
              <Loader2 v-if="isLoadingPortal" class="w-4 h-4 mr-2 animate-spin" />
              Manage Subscription
            </Button>
          </div>

          <p v-if="subscription?.hasStripeCustomer" class="text-sm text-gray-600 mb-6">
            Manage your subscription, change plans, update payment methods, and download invoices.
          </p>
        </div>

        <!-- Pricing Tiers -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold mb-4">
            Available Plans
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="tier in tiers"
              :key="tier.id"
              :class="[
                'rounded-lg border p-6',
                tier.id === currentTier ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white',
                tier.highlighted && tier.id !== currentTier ? 'ring-2 ring-indigo-600' : ''
              ]"
            >
              <!-- Tier Header -->
              <div class="mb-4">
                <h4 class="text-lg font-bold text-gray-900">
                  {{ tier.name }}
                </h4>
                <p class="text-sm text-gray-600">
                  {{ tier.description }}
                </p>
                <p class="mt-2">
                  <span class="text-2xl font-bold text-gray-900">{{ tier.price }}</span>
                  <span v-if="tier.price !== '$0'" class="text-sm text-gray-600">/month</span>
                </p>
              </div>

              <!-- Features (compact) -->
              <ul class="space-y-2 mb-4">
                <li v-for="feature in tier.features.slice(0, 4)" :key="feature.text" class="flex items-start">
                  <Component
                    :is="feature.included ? Check : X"
                    :class="[
                      'h-4 w-4 flex-shrink-0 mt-0.5',
                      feature.included ? 'text-green-500' : 'text-gray-300'
                    ]"
                  />
                  <span class="ml-2 text-sm text-gray-700">{{ feature.text }}</span>
                </li>
              </ul>

              <!-- CTA Button -->
              <div>
                <Button
                  v-if="subscriptionLoading"
                  class="w-full"
                  size="sm"
                  variant="outline"
                  disabled
                >
                  Loading...
                </Button>
                <Button
                  v-else-if="tier.id === currentTier"
                  class="w-full"
                  size="sm"
                  variant="outline"
                  disabled
                >
                  Current Plan
                </Button>
                <Button
                  v-else-if="tier.id === 'free' && hasActiveSubscription"
                  class="w-full"
                  size="sm"
                  variant="outline"
                  @click="openBillingPortal"
                >
                  Manage Subscription
                </Button>
                <Button
                  v-else-if="tier.id === 'free' && !hasActiveSubscription"
                  class="w-full"
                  size="sm"
                  variant="outline"
                  disabled
                >
                  Current Plan
                </Button>
                <Button
                  v-else-if="hasActiveSubscription"
                  class="w-full"
                  size="sm"
                  :variant="tier.highlighted ? 'default' : 'outline'"
                  @click="openBillingPortal"
                >
                  Change Plan
                </Button>
                <Button
                  v-else
                  class="w-full"
                  size="sm"
                  :variant="tier.highlighted ? 'default' : 'outline'"
                  :disabled="isUpgrading || subscriptionLoading"
                  @click="handleInitialSubscription(tier.id, tier.priceId)"
                >
                  <template v-if="isUpgrading">
                    <Loader2 class="w-4 h-4 animate-spin" />
                  </template>
                  <template v-else>
                    Upgrade to {{ tier.name }}
                  </template>
                </Button>
              </div>
            </div>
          </div>

          <p class="text-xs text-gray-500 mt-4 text-center">
            <a href="/pricing" class="underline">View full feature comparison</a>
          </p>
        </div>
      </div>
    </div>

    <!-- Debug Section (hidden by default) -->
    <div class="mt-6 text-center">
      <button
        class="text-xs text-gray-500 hover:text-gray-700"
        @click="showDebug = !showDebug"
      >
        {{ showDebug ? 'Hide' : 'Show' }} Debug Info
      </button>
    </div>

    <div v-if="showDebug" class="bg-gray-100 rounded-lg border shadow-sm mt-4 p-4">
      <h3 class="font-semibold mb-2">
        Debug Information
      </h3>
      <div class="space-y-2 text-sm font-mono">
        <div>User ID: {{ user?.id }}</div>
        <div>Email: {{ user?.email }}</div>
        <div>Subscription Tier: {{ subscription?.tier }}</div>
        <div>Subscription Status: {{ subscription?.status }}</div>
        <div>Has Stripe Customer: {{ subscription?.hasStripeCustomer }}</div>
        <div>
          <Button
            size="sm"
            variant="outline"
            @click="fetchDebugData"
          >
            Fetch Stripe Debug Data
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
