<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug.toString();
</script>

<template>
  <div class="markdown-wrapper">
    <ContentDoc class="markdown-layout" :path="slug">
      <template #default="{ doc }">
        <h1>
          <i class="pi pi-fw text-3xl mr-2" :class="`pi-${doc.icon}`" v-if="doc.icon" />{{
            doc.title
          }}
        </h1>
        <!-- <p>{{ doc.description }}</p> -->
        <hr />
        <ContentRenderer :value="doc" />
      </template>
      <!-- Slot if document is not found -->
      <template #not-found>
        <h1 class="text-2xl">Content Page ({{ slug }}) not found</h1>
      </template>
    </ContentDoc>
  </div>
</template>

<style>
.markdown-wrapper {
  li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  img {
    max-width: 100%;
  }
}
</style>
