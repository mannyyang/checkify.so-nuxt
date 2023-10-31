<script setup lang="ts">
import Button from 'primevue/button';

definePageMeta({
  layout: 'embed'
});

const { data, pending, error, refresh, status } = await useFetch(
  '/api/get-checkboxes',
  {
    lazy: true
  }
);

// refresh every 60 minutes
setTimeout(() => {
  refresh();
}, 3600000);

const resp = data.value;

console.log(resp);
</script>

<template>
  <div class="p4">
    <Button label="Refresh" @click="() => refresh()" />

    <div class="" v-if="pending">loading...</div>
    <div class="pages" v-for="page in resp" v-else>
      <h3 class="pt-4">{{ page.page.properties['Name'].title[0].plain_text }}</h3>
      <div
        class="flex align-items-center mb-2"
        v-for="checkbox in page.checkboxes"
      >
        <Checkbox
          v-model="checkbox.to_do.checked"
          :inputId="checkbox.id"
          :value="checkbox.to_do.checked"
          binary
        />
        <label :for="checkbox.id" class="ml-2">
          {{ checkbox.to_do.rich_text[0].plain_text }}
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
