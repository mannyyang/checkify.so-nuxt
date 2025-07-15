<script setup lang="ts">
// Test queryContent directly
const { data: allContent } = await useAsyncData(
  'all-content',
  () => queryContent().find()
);

const { data: docsContent } = await useAsyncData(
  'docs-content',
  () => queryContent('docs').find()
);

const { data: specificDoc } = await useAsyncData(
  'specific-doc',
  () => queryContent('docs', 'connect-notion').findOne()
);
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">
      Nuxt Content Debug
    </h1>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">
        All Content:
      </h2>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">{{ JSON.stringify(allContent, null, 2) }}</pre>
    </div>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">
        Docs Content:
      </h2>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">{{ JSON.stringify(docsContent, null, 2) }}</pre>
    </div>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">
        Specific Doc (connect-notion):
      </h2>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">{{ JSON.stringify(specificDoc, null, 2) }}</pre>
    </div>
  </div>
</template>
