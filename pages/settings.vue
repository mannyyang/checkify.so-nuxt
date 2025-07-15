<script setup lang="ts">
import { CreditCard, Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'dashboard'
});

const user = useSupabaseUser();
const { data: subscription, refresh: refreshSubscription } = await useFetch('/api/subscription');
const isLoadingPortal = ref(false);

// Check for success from Stripe checkout
onMounted(() => {
  const route = useRoute();
  if (route.query.success === 'true') {
    toast.success(`You've been upgraded to the ${route.query.tier} plan!`);
    // Clear query params
    navigateTo('/settings', { replace: true });
    // Refresh subscription data
    refreshSubscription();
  }
});

async function openBillingPortal () {
  if (!subscription.value?.hasStripeCustomer) {
    navigateTo('/pricing');
    return;
  }

  isLoadingPortal.value = true;
  try {
    const { data } = await $fetch('/api/stripe/create-portal-session', {
      method: 'POST'
    });

    if (data?.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Error opening billing portal:', error);
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
          <span
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              tierColors[subscription?.tier || 'free']
            ]"
          >
            {{ tierLabels[subscription?.tier || 'free'] }} Plan
          </span>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-600">Current Plan</label>
            <p class="font-medium">
              {{ tierLabels[subscription?.tier || 'free'] }}
              <template v-if="subscription?.tier === 'free'">
                - $0/month
              </template>
              <template v-else-if="subscription?.tier === 'pro'">
                - $9/month
              </template>
              <template v-else-if="subscription?.tier === 'max'">
                - $29/month
              </template>
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
              Manage Billing
            </Button>
            <Button
              v-if="subscription?.tier === 'free'"
              variant="default"
              @click="navigateTo('/pricing')"
            >
              Upgrade Plan
            </Button>
          </div>

          <p v-if="subscription?.hasStripeCustomer" class="text-sm text-gray-600">
            Manage your subscription, update payment methods, and download invoices.
          </p>
          <p v-else class="text-sm text-gray-600">
            Upgrade to a paid plan to unlock more features and remove limits.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
