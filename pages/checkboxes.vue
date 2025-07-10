<script setup lang="ts">
import { ToDoBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import Button from 'primevue/button';

definePageMeta({
  layout: 'embed'
});

const showChecked = ref(true);
const showSidebar = ref(false);

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
  return ((metrics.value.checked / metrics.value.total) * 100).toFixed(1) || 0;
});

const filtered = computed(() => {
  if (data.value) {
    return data.value.map((page) => {
      return {
        page: page.page,
        checkboxes: page.checkboxes.filter((checkbox) => {
          if (showChecked.value) {
            return checkbox;
          }

          return !checkbox.to_do.checked;
        })
      };
    });
  }

  return [];
});

const checkboxList = computed(() => {
  if (showChecked.value) {
    return data.value;
  } else {
    return filtered.value;
  }
});

const onTodoUpdate = async (checkbox: ToDoBlockObjectResponse) => {
  await useFetch('/api/set-checkbox', {
    method: 'POST',
    body: checkbox
  });
};

const parseBlockLink = (blockId: string, parentId: string) => {
  // Ex. https://www.notion.so/8c25175876f44559804acd1e632791f5?pvs=4#ac313eeb57a541b4a6468cf3ee104b72
  const url = `https://www.notion.so/${parentId.replaceAll(
    '-',
    ''
  )}?pvs=4#${blockId.replaceAll('-', '')}`;
  return url;
};

// refresh every 60 minutes
setTimeout(() => {
  refresh();
}, 3600000);
</script>

<template>
  <div class="flex flex-col">
    <div class="todos-container flex-1 relative">
      <Toolbar class="fixed rounded-2 z-2">
        <template #start>
          <span class="text-lg font-bold mr-4">My Todos</span>
        </template>

        <template #center>
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            :loading="pending"
            @click="() => refresh()"
          />
        </template>

        <template #end>
          <Button
            icon="pi pi-cog"
            aria-label="Settings"
            @click="() => (showSidebar = true)"
          />
        </template>
      </Toolbar>

      <ScrollPanel style="height: 100vh">
        <div class="pt-20">
          <div
            v-for="item in checkboxList"
            :key="item.page.id"
            class="page-container"
          >
            <div v-if="item.checkboxes.length" class="page pb-lg">
              <h4>
                {{ item.page.properties['Name'].title[0].plain_text }}
              </h4>
              <div
                v-for="checkbox in item.checkboxes"
                :key="checkbox.id"
                class="flex align-items-center mb-2"
              >
                <Checkbox
                  v-model="checkbox.to_do.checked"
                  :input-id="checkbox.id"
                  :value="checkbox.to_do.checked"
                  binary
                  @input="onTodoUpdate(checkbox)"
                />
                <label :for="checkbox.id" class="ml-2">
                  {{ checkbox.to_do.rich_text[0].plain_text }}
                  <a
                    class="pi pi-link"
                    target="_blank"
                    :href="parseBlockLink(checkbox.id, item.page.id)"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </ScrollPanel>
    </div>

    <Sidebar v-model:visible="showSidebar" position="right">
      <div class="actions-container">
        <Card
          class="mb-4 shadow-none rounded-2 border-1 border-solid border-gray-400"
        >
          <template #title>
            Todos
          </template>
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

        <Divider />

        <Toolbar class="rounded-2">
          <template #start>
            <span class="mr-2">Show Checked</span>
            <InputSwitch v-model="showChecked" />
          </template>
        </Toolbar>
      </div>
    </Sidebar>
  </div>
</template>

<style scoped></style>
