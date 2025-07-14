<script setup lang="ts">
import { CheckCircle2, RefreshCw, Eye } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';

const features = [
  {
    id: 'synced-todos',
    icon: CheckCircle2,
    title: 'Synced Todos & Metrics',
    description: "Todo's are now synced with your notion blocks as in if you check a todo in the view, it will be reflected in your notion page.",
    additionalText: "See how you're doing with metrics. View status with a clean progress bar.",
    videoSrc: '/recording/synced-todos.mov?url',
    reversed: false
  },
  {
    id: 'refresh',
    icon: RefreshCw,
    title: 'Refreshing Todos',
    description: "Todo's are synced every hour, but a manual refresh button is included.",
    videoSrc: '/recording/manual-refresh.mov?url',
    reversed: true
  },
  {
    id: 'hide-completed',
    icon: Eye,
    title: 'Hide completed tasks',
    description: 'Hide completed tasks for a focused and clean view.',
    videoSrc: '/recording/hide-completed.mov?url',
    reversed: false
  }
];

const visibleFeatures = ref(new Set());

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleFeatures.value.add(entry.target.dataset.featureId);
        }
      });
    },
    { threshold: 0.1 }
  );

  // Observe all feature elements
  document.querySelectorAll('[data-feature-id]').forEach((el) => {
    observer.observe(el);
  });

  return () => observer.disconnect();
});
</script>

<template>
  <section id="features" class="py-24 px-4">
    <div class="mx-auto max-w-7xl">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-foreground mb-4">
          Everything You Need to Master Your Tasks
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Powerful features designed to bring clarity to your Notion workspace
        </p>
      </div>

      <!-- Features List -->
      <div class="space-y-24">
        <div
          v-for="(feature, index) in features"
          :key="feature.id"
          :data-feature-id="feature.id"
          :class="[
            'flex flex-col lg:flex-row items-center gap-8 lg:gap-16 transition-all duration-1000 transform',
            feature.reversed ? 'lg:flex-row-reverse' : '',
            visibleFeatures.has(feature.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          ]"
        >
          <!-- Content Side -->
          <div class="flex-1 text-center lg:text-left">
            <div
              :class="[
                'inline-flex p-3 rounded-2xl mb-6',
                'bg-primary/10 text-primary'
              ]"
            >
              <component :is="feature.icon" class="w-8 h-8" />
            </div>
            
            <h3 class="text-3xl font-semibold mb-4">
              {{ feature.title }}
            </h3>
            
            <p class="text-lg text-muted-foreground mb-3">
              {{ feature.description }}
            </p>
            
            <p v-if="feature.additionalText" class="text-lg text-muted-foreground">
              {{ feature.additionalText }}
            </p>
          </div>

          <!-- Video Side -->
          <div class="flex-1">
            <div
              :class="[
                'relative overflow-hidden rounded-2xl shadow-2xl',
                'ring-1 ring-border/50',
                'transition-transform duration-500 hover:scale-[1.02]'
              ]"
            >
              <video
                class="w-full h-auto"
                autoplay
                loop
                muted
                playsinline
              >
                <source :src="feature.videoSrc" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Add subtle animation keyframes if needed */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>