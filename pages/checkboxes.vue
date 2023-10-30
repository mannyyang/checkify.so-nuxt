<script setup lang="ts">
definePageMeta({
  layout: 'embed'
});

const { data, pending, error, refresh } = await useFetch('/api/get-checkboxes');
const resp = data.value;

console.log(resp);


</script>

<template>
  <div>
    <div class="pages p4" v-for="page in resp">
      <h3>{{ page.page.properties['Name'].title[0].plain_text }}</h3>
      <div class="flex align-items-center mb-2" v-for="checkbox in page.checkboxes">
        <Checkbox v-model="checkbox.to_do.checked" :inputId="checkbox.id" :value="checkbox.to_do.checked" binary />
        <label :for="checkbox.id" class="ml-2"> {{ checkbox.to_do.rich_text[0].plain_text }} </label>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
