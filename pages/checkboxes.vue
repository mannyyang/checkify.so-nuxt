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

const metrics = computed(() => {
  if (data.value) {
    return data.value.reduce(
      (acc, page) => {
        page.checkboxes.forEach((checkbox) => {
          if (checkbox.to_do.checked) {
            acc.checked++;
          } else {
            acc.unchecked++;
          }

          acc.total++;
        });
        return acc;
      },
      { checked: 0, unchecked: 0, total: 0 }
    );
  }

  return { checked: 0, unchecked: 0, total: 0 };
});

const percentage = computed(() => {
  return (metrics.value.checked / metrics.value.total) * 100 || 0;
});

const showChecked = ref(false);

// refresh every 60 minutes
setTimeout(() => {
  refresh();
}, 3600000);

const resp = data.value;

console.log(resp);
</script>

<template>
  <div class="flex p4">
    <div class="todos-container flex-1">
      <div class="page pb-lg" v-for="page in resp" :key="page.page.id">
        <h4>
          {{ page.page.properties['Name'].title[0].plain_text }}
        </h4>
        <div
          class="flex align-items-center mb-2"
          v-for="checkbox in page.checkboxes"
          :key="checkbox.id"
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

    <div class="actions-container max-w-sm pl-8">
      <Toolbar class="mb-4 rounded-2">
        <template #start>
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            :loading="pending"
            @click="() => refresh()"
          />
        </template>

        <template #end>
          <span class="mr-2">Show Checked</span>
          <InputSwitch v-model="showChecked" />
        </template>
      </Toolbar>

      <Card class="shadow-none rounded-2 border-1 border-solid border-gray-400">
        <template #title> Todos </template>
        <template #content>
          <span class="text-gray-900 font-medium text-3xl">
            {{ percentage }}%
            <span class="text-gray-600">
              ({{ metrics.checked }}/{{ metrics.total }})
            </span>
          </span>
          <ProgressBar class="my-3 pb-2" :value="percentage" />
          <div class="text-xl font-medium">
            {{ metrics.unchecked }} Remaining
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped></style>
