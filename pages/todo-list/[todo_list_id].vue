<script setup lang="ts">
import type { ToDoBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

definePageMeta({
  layout: 'embed'
});

const route = useRoute();
const toast = useToast();
const posthog = usePostHog();

const showChecked = ref(true);
const showSidebar = ref(false);
const showSyncDialog = ref(false);
const syncParentPageId = ref('');
const syncLoading = ref(false);
const lastSyncDate = ref<Date | null>(null);
const syncDatabaseId = ref<string | null>(null);

const isNotionSyncEnabled = ref(false);

// Check feature flag when component mounts and when flags load
onMounted(() => {
  // Check immediately
  isNotionSyncEnabled.value = posthog.isFeatureEnabled('notion-database-sync') || false;

  // Also check when flags are loaded
  posthog.onFeatureFlags(() => {
    isNotionSyncEnabled.value = posthog.isFeatureEnabled('notion-database-sync') || false;
  });
});

const { data, pending, refresh } = await useFetch(
  '/api/todo-list/' + route.params.todo_list_id,
  {
    lazy: true
  }
);

const metrics = computed(() => {
  if (data.value?.pages) {
    return data.value.pages.reduce(
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
  if (data.value?.pages) {
    return data.value.pages.map((page) => {
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
    return data.value?.pages || [];
  } else {
    return filtered.value;
  }
});

// Set sync info when data loads
watchEffect(() => {
  if (data.value?.syncInfo) {
    syncDatabaseId.value = data.value.syncInfo.syncDatabaseId;
    lastSyncDate.value = data.value.syncInfo.lastSyncDate ? new Date(data.value.syncInfo.lastSyncDate) : null;
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

const syncToNotion = async () => {
  if (!syncDatabaseId.value && !syncParentPageId.value) {
    showSyncDialog.value = true;
    return;
  }

  syncLoading.value = true;
  try {
    const response = await $fetch('/api/todo-list/sync-to-notion', {
      method: 'POST',
      body: {
        todo_list_id: route.params.todo_list_id,
        parent_page_id: syncParentPageId.value || undefined
      }
    });

    if (response.success) {
      syncDatabaseId.value = response.syncDatabaseId;
      lastSyncDate.value = new Date();
      showSyncDialog.value = false;

      toast.add({
        severity: 'success',
        summary: 'Sync Successful',
        detail: `Created: ${response.syncResults.created}, Updated: ${response.syncResults.updated}`,
        life: 5000
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Sync Failed',
      detail: error.message || 'Failed to sync to Notion',
      life: 5000
    });
  } finally {
    syncLoading.value = false;
  }
};

const formatDate = (date: Date | null) => {
  if (!date) { return 'Never'; }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};
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
                {{ item.page.properties['Name']?.title?.[0]?.plain_text }}
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
                  {{
                    checkbox.to_do.rich_text.length > 0
                      ? checkbox.to_do.rich_text[0].plain_text
                      : ''
                  }}
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

        <Divider v-if="isNotionSyncEnabled" />

        <Card v-if="isNotionSyncEnabled" class="mt-4 shadow-none rounded-2 border-1 border-solid border-gray-400">
          <template #title>
            Sync to Notion
          </template>
          <template #content>
            <div class="flex flex-col gap-3">
              <Button
                label="Sync to Notion Database"
                icon="pi pi-sync"
                class="w-full"
                :loading="syncLoading"
                @click="syncToNotion"
              />
              <div v-if="lastSyncDate" class="text-sm text-gray-600">
                Last synced: {{ formatDate(lastSyncDate) }}
              </div>
              <div v-if="syncDatabaseId" class="text-sm text-gray-600">
                <a
                  :href="`https://notion.so/${syncDatabaseId.replace(/-/g, '')}`"
                  target="_blank"
                  class="text-blue-600 hover:underline"
                >
                  View Sync Database <i class="pi pi-external-link text-xs" />
                </a>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </Sidebar>

    <Dialog
      v-model:visible="showSyncDialog"
      modal
      :style="{ width: '450px' }"
      header="Create Sync Database"
    >
      <div class="flex flex-col gap-3">
        <p class="text-gray-700">
          To create a sync database, please provide the Notion page ID where you want the database to be created.
        </p>
        <div class="flex flex-col gap-2">
          <label for="pageId" class="font-medium">Parent Page ID</label>
          <InputText
            id="pageId"
            v-model="syncParentPageId"
            placeholder="Enter Notion page ID"
            class="w-full"
          />
          <small class="text-gray-600">
            You can find the page ID in the Notion URL after the workspace name
          </small>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          text
          @click="showSyncDialog = false"
        />
        <Button
          label="Create & Sync"
          :loading="syncLoading"
          :disabled="!syncParentPageId"
          @click="syncToNotion"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<style scoped></style>
