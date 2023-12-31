<script setup>
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
  </NuxtLayout>
</template>

<style lang="scss">
@import 'App.scss';

// Global Overrides
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.p-icon-spin {
  animation: spin 2s linear infinite;
}
</style>
