<script setup lang="ts">
import { computed, watch, ref } from 'vue';
</script>

<template>
  <div>
    <Link
      rel="stylesheet"
      :href="'https://cdn.jsdelivr.net/npm/primevue@3.38.0/resources/themes/fluent-light/theme.css'"
    />
    <slot />
  </div>
</template>

<style lang="scss" scoped></style>
