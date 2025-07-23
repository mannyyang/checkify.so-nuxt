<script setup>
import { onMounted } from 'vue';
import { Toaster } from '@/components/ui/sonner';
import 'vue-sonner/style.css';

const user = useSupabaseUser();
const posthog = usePostHog();
const { syncStripeCustomer } = useStripeSync();

onMounted(() => {
  if (user.value) {
    posthog.identify(user.value.id, {
      email: user.value.email
    });
  }
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
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/checkify-logo.png'
    }
  ],
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
