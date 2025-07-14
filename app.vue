<script setup>
import { onMounted } from 'vue';
import { Toaster } from '@/components/ui/sonner';

const user = useSupabaseUser();
const posthog = usePostHog();

onMounted(() => {
  if (user.value) {
    posthog.identify(user.value.id, {
      email: user.value.email
    });
  }

  // Wait for feature flags to load
  posthog.onFeatureFlags(() => {
    const isNotionSyncEnabled = posthog.isFeatureEnabled('notion-database-sync');
    console.log('Notion Database Sync feature flag:', isNotionSyncEnabled);
  });
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

useHead({
  title: 'Checkify.so',
  script: [
    {
      src: 'https://umami-production-c952.up.railway.app/script.js',
      async: true,
      'data-website-id': 'd57b10bc-9af3-4710-a7ba-8f3d02a0d418'
    }
  ]
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
    <Toaster />
  </NuxtLayout>
</template>

<style>
/* Animation moved to Tailwind - use animate-spin utility class instead */
</style>
