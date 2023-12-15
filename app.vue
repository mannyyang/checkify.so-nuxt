<script setup>
useHead({
  title: 'Checkify.so'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style lang='scss'>
@import 'App.scss';

// Global Overrides
@keyframes spin {
    to {transform:rotate(360deg);}
}

.p-icon-spin {
  animation: spin 2s linear infinite;
}
</style>
