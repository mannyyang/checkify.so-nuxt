export const useStripeSync = () => {
  const user = useSupabaseUser();

  const syncStripeCustomer = async () => {
    if (!user.value) { return; }

    try {
      await $fetch('/api/stripe/sync-customer', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to sync Stripe customer:', error);
    }
  };

  // Auto-sync when user logs in
  watch(user, async (newUser) => {
    if (newUser) {
      // Give the auth session time to settle
      setTimeout(() => {
        syncStripeCustomer();
      }, 1000);
    }
  });

  return {
    syncStripeCustomer
  };
};
