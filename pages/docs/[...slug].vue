<script setup lang="ts">
const route = useRoute();
const slug = computed(() => {
  const params = route.params.slug;
  return Array.isArray(params) ? params.join('/') : params?.toString() || '';
});

// Use Nuxt Content v3 syntax
const { data: page } = await useAsyncData(
  `docs-${slug.value}`,
  () => queryCollection('content').path(`/docs/${slug.value}`).first()
);
</script>

<template>
  <div class="markdown-wrapper">
    <div v-if="page" class="markdown-layout">
      <h1 class="text-3xl font-bold mb-4">
        <i class="pi pi-fw text-3xl mr-2" :class="`pi-${page.icon}`" v-if="page.icon" />
        {{ page.title }}
      </h1>
      <hr class="mb-4" />
      <ContentRenderer :value="page" class="prose max-w-none" />
    </div>
    <div v-else class="text-center py-8">
      <h1 class="text-2xl text-muted-foreground">
        Content Page not found
      </h1>
      <p class="text-sm text-muted-foreground mt-2">
        Looking for: /{{ slug }}
      </p>
    </div>
  </div>
</template>

<style>
.markdown-wrapper :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.markdown-wrapper :deep(img) {
  max-width: 100%;
  border-radius: 0.5rem;
}

.markdown-wrapper :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-wrapper :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-wrapper :deep(p) {
  margin-bottom: 1rem;
}

.markdown-wrapper :deep(code) {
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.markdown-wrapper :deep(pre) {
  background-color: hsl(var(--muted));
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-wrapper :deep(blockquote) {
  border-left: 4px solid hsl(var(--primary));
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
}
</style>