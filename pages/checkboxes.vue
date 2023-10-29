<script setup lang="ts">
definePageMeta({
  layout: 'embed'
});

const { data, pending, error, refresh } = await useFetch('/api/get-checkboxes');
const resp = data.value;
</script>

<template>
  <div>
    <div class="pages" v-for="page in resp">
      <div class="flex align-items-center" v-for="checkbox in page.checkboxes">
        <Checkbox v-model="checkbox.to_do.checked" :inputId="checkbox.id" :value="checkbox.to_do.checked" binary />
        <label :for="checkbox.id" class="ml-2"> {{ checkbox.to_do.rich_text[0].text.content }} </label>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
