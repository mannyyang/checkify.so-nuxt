<script setup lang="ts">
const themeStore = useThemeStore();
</script>

<template>
  <div class="public-layout">
    <Link rel="stylesheet" :href="themeStore.link" />
    <slot />
  </div>
</template>

<style lang="scss"></style>
