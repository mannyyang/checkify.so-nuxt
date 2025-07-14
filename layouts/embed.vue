<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { Toaster } from '@/components/ui/sonner';
</script>

<template>
  <div class="embed-layout">
    <slot />
    <Toaster />
  </div>
</template>

<style lang="scss">
html,
body {
  background: white;
}
</style>
