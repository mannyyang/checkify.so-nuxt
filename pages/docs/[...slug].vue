<script setup lang="ts">
const route = useRoute();

// Get the slug parameter
const slugParam = route.params.slug;
const slug = Array.isArray(slugParam) ? slugParam.join('/') : slugParam || '';

// Fetch the content
const { data: page, error } = await useAsyncData(
  `docs-${slug}`,
  () => queryCollection('content').path(`/docs/${slug}`).first()
);

// Debug logging
onMounted(() => {
  console.log('Docs page mounted');
  console.log('Slug:', slug);
  console.log('Page data:', page.value);
  console.log('Error:', error.value);
});
</script>

<template>
  <div class="markdown-wrapper">
    <div v-if="page" class="markdown-layout max-w-4xl mx-auto px-6 py-8">
      <h1 class="text-3xl font-bold mb-4">
        <i v-if="page.icon" class="pi pi-fw text-3xl mr-2" :class="`pi-${page.icon}`" />
        {{ page.title }}
      </h1>
      <hr class="mb-4">
      <ContentRenderer :value="page" class="prose-lg max-w-none" />
    </div>
    <div v-else class="text-center py-8">
      <h1 class="text-2xl text-muted-foreground">
        Content Page not found
      </h1>
      <p class="text-sm text-muted-foreground mt-2">
        Looking for: docs/{{ slug }}
      </p>
      <p class="text-xs text-muted-foreground mt-4">
        Debug: slug = "{{ slug }}"
      </p>
      <p v-if="error" class="text-xs text-red-500 mt-2">
        Error: {{ error }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* More specific styles for prose content */
.markdown-wrapper :deep(.prose-lg p) {
  margin-bottom: 1.5rem !important;
  line-height: 1.7;
}

.markdown-wrapper :deep(.prose-lg p + p) {
  margin-top: 1.5rem !important;
}

.markdown-wrapper :deep(.prose-lg li) {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.markdown-wrapper :deep(.prose-lg img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  display: block;
  margin: 1.5rem auto;
}

.markdown-wrapper :deep(.prose-lg h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem !important;
  margin-bottom: 1rem !important;
}

.markdown-wrapper :deep(.prose-lg h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem !important;
  margin-bottom: 0.75rem !important;
}

.markdown-wrapper :deep(.prose-lg code) {
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.markdown-wrapper :deep(.prose-lg pre) {
  background-color: hsl(var(--muted));
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1.5rem !important;
  margin-top: 1.5rem !important;
}

.markdown-wrapper :deep(.prose-lg blockquote) {
  border-left: 4px solid hsl(var(--primary));
  padding-left: 1rem;
  margin: 1.5rem 0 !important;
  font-style: italic;
}

/* Ensure spacing between all direct children */
.markdown-wrapper :deep(.prose-lg > *) {
  margin-bottom: 1rem !important;
}

.markdown-wrapper :deep(.prose-lg > *:last-child) {
  margin-bottom: 0 !important;
}
</style>
