<script setup lang="ts">
import { Check, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { PRICING_TIERS, type TierName } from '~/utils/pricing';

definePageMeta({
  layout: 'public'
});

// Check if user is authenticated
const user = useSupabaseUser();

// Fetch current subscription only if authenticated
const { data: subscription, pending: subscriptionLoading } = await useFetch('/api/subscription', {
  // Only fetch if user is authenticated
  immediate: !!user.value,
  watch: [user]
});

const isLoading = ref(false);
const currentTier = computed(() => subscription.value?.tier || 'free');
const hasActiveSubscription = computed(() =>
  subscription.value?.status === 'active' &&
  subscription.value?.tier !== 'free'
);

// Get runtime config for Stripe price IDs
const config = useRuntimeConfig();

// Add price IDs to tiers based on runtime config
const tiers = PRICING_TIERS.map(tier => ({
  ...tier,
  priceId: tier.id === 'pro'
    ? config.public.stripePriceIdPro
    : tier.id === 'max'
      ? config.public.stripePriceIdMax
      : undefined,
  disabled: tier.id === 'free'
}));

async function handleUpgrade (tier: string, priceId?: string) {
  if (!priceId || tier === 'free') {
    return;
  }

  // Check if user is authenticated
  if (!user.value) {
    // Redirect to login page with return URL
    await navigateTo('/login?redirect=/pricing');
    return;
  }

  // Prevent action if subscription data is still loading
  if (subscriptionLoading.value) {
    toast.error('Please wait while we load your subscription data');
    return;
  }

  isLoading.value = true;
  try {
    // Check if user has an active subscription
    if (hasActiveSubscription.value) {
      // Use update endpoint for existing subscriptions
      const data = await $fetch('/api/stripe/update-subscription', {
        method: 'POST',
        body: {
          priceId,
          tier
        }
      });

      if (data?.success) {
        toast.success('Your subscription is being updated. You will receive an email confirmation shortly.');
        // Refresh the subscription data
        await refresh();
      }
    } else {
      // Use create checkout session for new subscriptions
      const data = await $fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        body: {
          priceId,
          tier
        }
      });

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Invalid response from server');
      }
    }
  } catch (error: any) {
    // Show the error message from the server if available
    const errorMessage = error.data?.statusMessage || 'Failed to process subscription. Please try again.';
    toast.error(errorMessage);
  } finally {
    isLoading.value = false;
  }
}

// Add refresh function to reload subscription data
const refresh = async () => {
  await refreshNuxtData('subscription');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 class="text-4xl font-bold text-gray-900">
          Simple, transparent pricing
        </h1>
        <p class="mt-4 text-xl text-gray-600">
          Choose the plan that's right for you
        </p>
      </div>
    </div>

    <!-- Pricing Cards -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          v-for="tier in tiers"
          :key="tier.id"
          :class="[
            'rounded-lg border bg-white p-8 shadow-sm',
            tier.highlighted ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-gray-200'
          ]"
        >
          <!-- Tier Header -->
          <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900">
              {{ tier.name }}
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              {{ tier.description }}
            </p>
            <p class="mt-4">
              <span class="text-4xl font-bold text-gray-900">{{ tier.price }}</span>
              <span v-if="tier.price !== '$0'" class="text-base text-gray-600">/month</span>
            </p>
          </div>

          <!-- Features -->
          <ul class="mt-8 space-y-4">
            <li v-for="feature in tier.features" :key="feature.text" class="flex items-start">
              <Component
                :is="feature.included ? Check : X"
                :class="[
                  'h-5 w-5 flex-shrink-0',
                  feature.included ? 'text-green-500' : 'text-gray-300'
                ]"
              />
              <span class="ml-3 text-sm text-gray-700">{{ feature.text }}</span>
            </li>
          </ul>

          <!-- CTA Button -->
          <div class="mt-8">
            <Button
              v-if="subscriptionLoading"
              class="w-full"
              variant="outline"
              disabled
            >
              Loading...
            </Button>
            <Button
              v-else-if="tier.id === currentTier"
              class="w-full"
              variant="outline"
              disabled
            >
              Current Plan
            </Button>
            <Button
              v-else-if="tier.id === 'free' && hasActiveSubscription"
              class="w-full"
              variant="outline"
              @click="() => navigateTo('/settings')"
            >
              Manage Subscription
            </Button>
            <Button
              v-else-if="tier.id === 'free' && !hasActiveSubscription"
              class="w-full"
              variant="outline"
              disabled
            >
              {{ tier.cta }}
            </Button>
            <Button
              v-else
              class="w-full"
              :variant="tier.highlighted ? 'default' : 'outline'"
              :disabled="isLoading || subscriptionLoading"
              @click="handleUpgrade(tier.id, tier.priceId)"
            >
              <template v-if="isLoading">
                Loading...
              </template>
              <template v-else-if="hasActiveSubscription && tier.id !== 'free'">
                Switch to {{ tier.name }}
              </template>
              <template v-else>
                {{ tier.cta }}
              </template>
            </Button>
          </div>

          <!-- Highlighted Badge -->
          <div v-if="tier.highlighted" class="absolute -top-4 left-1/2 -translate-x-1/2">
            <span class="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="text-2xl font-bold text-gray-900 text-center mb-8">
        Frequently Asked Questions
      </h2>

      <div class="space-y-8">
        <div>
          <h3 class="font-semibold text-gray-900">
            Can I change plans anytime?
          </h3>
          <p class="mt-2 text-gray-600">
            Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any charges.
          </p>
        </div>

        <div>
          <h3 class="font-semibold text-gray-900">
            What payment methods do you accept?
          </h3>
          <p class="mt-2 text-gray-600">
            We accept all major credit cards through our secure payment processor, Stripe.
          </p>
        </div>

        <div>
          <h3 class="font-semibold text-gray-900">
            Is there a free trial?
          </h3>
          <p class="mt-2 text-gray-600">
            We offer a generous free tier that you can use indefinitely. This lets you try Checkify and see if it's right for you before upgrading.
          </p>
        </div>

        <div>
          <h3 class="font-semibold text-gray-900">
            How do I cancel my subscription?
          </h3>
          <p class="mt-2 text-gray-600">
            You can cancel your subscription anytime from your account settings. You'll continue to have access to paid features until the end of your billing period.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the pricing cards are positioned correctly for the badge */
.grid > div {
  position: relative;
}
</style>
