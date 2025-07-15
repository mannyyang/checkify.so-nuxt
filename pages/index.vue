<script setup lang="ts">
import HeroSection from '~/components/blocks/HeroSection.vue';
import FeaturesSection from '~/components/blocks/FeaturesSection.vue';
import FooterSection from '~/components/blocks/FooterSection.vue';

definePageMeta({
  layout: 'public'
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Hero Section -->
    <HeroSection />

    <!-- Features Section -->
    <FeaturesSection />

    <!-- Footer Section -->
    <FooterSection />
  </div>
</template>

<style scoped></style>
