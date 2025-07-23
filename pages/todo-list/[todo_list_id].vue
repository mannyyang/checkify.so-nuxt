<script setup lang="ts">
import type { ToDoBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { toast } from 'vue-sonner';
import { RefreshCw, Settings, ExternalLink, RotateCw } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';

interface TodoListData {
  pages: Array<{
    page: any;
    checkboxes: ToDoBlockObjectResponse[];
  }>;
  syncInfo?: {
    syncDatabaseId: string | null;
    lastSyncDate: string | null;
  };
  metadata?: {
    totalPages: number;
    totalCheckboxes: number;
    pagesWithCheckboxes: number;
    extractionComplete: boolean;
    errors: string[];
    limits?: {
      tier: string;
      maxPages?: number;
      maxCheckboxesPerPage?: number;
      pagesLimited: boolean;
      reachedPageLimit: boolean;
    };
  };
}

definePageMeta({
  layout: 'embed'
});

const route = useRoute();

const showChecked = ref(true);
const showSyncDialog = ref(false);
const syncParentPageId = ref('');
const syncLoading = ref(false);
const lastSyncDate = ref<Date | null>(null);

// Function to extract page ID from Notion URL or return the input as-is
const extractNotionPageId = (input: string): string => {
  const cleanInput = input.trim();
  const withoutDashes = cleanInput.replace(/-/g, '');

  // If it's already a page ID (32 chars without dashes or 36 chars with dashes), return as-is
  if (/^[a-f0-9]{32}$/i.test(withoutDashes) && (cleanInput.length === 32 || cleanInput.length === 36)) {
    return cleanInput;
  }

  // For Notion URLs, extract the page ID from the path, not from query parameters
  if (cleanInput.includes('notion.so/')) {
    // Remove query parameters
    const urlWithoutQuery = cleanInput.split('?')[0];

    // Match the last 32-character hex string in the path
    // This handles URLs like: /workspace/Page-Name-{id} or /Page-Name-{id}
    const patterns = [
      /([a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12})$/i,
      /([a-f0-9]{32})$/i
    ];

    for (const pattern of patterns) {
      const match = urlWithoutQuery.match(pattern);
      if (match) {
        return match[1];
      }
    }
  }

  // Fallback: look for any 32-char hex string (but this might match query params)
  const patterns = [
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    /([a-f0-9]{32})/i
  ];

  for (const pattern of patterns) {
    const matches = cleanInput.match(new RegExp(pattern, 'gi'));
    if (matches && matches.length > 0) {
      return matches[0]; // Return first match instead of last
    }
  }

  console.warn('Could not extract page ID from:', cleanInput);
  return cleanInput;
};
const syncDatabaseId = ref<string | null>(null);

const { data, pending, refresh } = useFetch<TodoListData>(
  '/api/todo-list/' + route.params.todo_list_id,
  {
    lazy: true,
    server: false // This ensures the fetch only happens on client side
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
  return ((metrics.value.checked / metrics.value.total) * 100) || 0;
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

const onTodoUpdate = async (checkbox: ToDoBlockObjectResponse, checked: boolean) => {
  checkbox.to_do.checked = checked;
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
    const response = await $fetch<{
      success: boolean;
      syncDatabaseId?: string;
      syncResults: {
        created: number;
        updated: number;
        errors: any[];
      };
      totalCheckboxes: number;
    }>('/api/todo-list/sync-to-notion', {
      method: 'POST',
      body: {
        todo_list_id: route.params.todo_list_id,
        parent_page_id: (() => {
          if (!syncParentPageId.value) { return undefined; }
          const extracted = extractNotionPageId(syncParentPageId.value);
          console.log('Sync parent page ID input:', syncParentPageId.value);
          console.log('Extracted page ID:', extracted);
          return extracted;
        })()
      }
    });

    if (response.success) {
      syncDatabaseId.value = response.syncDatabaseId || null;
      lastSyncDate.value = new Date();
      showSyncDialog.value = false;

      toast.success('Sync Successful', {
        description: `Created: ${response.syncResults.created}, Updated: ${response.syncResults.updated}`
      });
    }
  } catch (error: any) {
    toast.error('Sync Failed', {
      description: error.message || 'Failed to sync to Notion'
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
  <SidebarProvider :default-open="false">
    <div class="flex w-full h-screen">
      <!-- Main Content -->
      <div class="flex-1 flex flex-col">
        <!-- Header Toolbar -->
        <div class="flex items-center justify-between bg-background border-b p-4">
          <span class="text-lg font-bold">My Todos</span>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="pending"
              @click="refresh"
            >
              <RefreshCw :class="{ 'animate-spin': pending }" class="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <SidebarTrigger>
              <Button variant="outline" size="sm">
                <Settings class="w-4 h-4" />
              </Button>
            </SidebarTrigger>
          </div>
        </div>

        <!-- Todo List Content -->
        <div class="flex-1 overflow-auto">
          <div v-if="pending" class="text-center py-12 text-muted-foreground">
            Loading todos...
          </div>
          <div v-else-if="checkboxList.length === 0" class="text-center py-12 text-muted-foreground">
            No todos found
          </div>

          <div v-else class="space-y-6">
            <div
              v-for="item in checkboxList"
              :key="item.page.id"
              class="space-y-4"
            >
              <div v-if="item.checkboxes.length" class="space-y-3">
                <h3 class="text-lg font-semibold border-b pb-2">
                  {{ item.page.properties['Name']?.title?.[0]?.plain_text }}
                </h3>

                <div class="space-y-2">
                  <div
                    v-for="checkbox in item.checkboxes"
                    :key="checkbox.id"
                    class="flex items-start gap-3 p-2 rounded-lg hover:bg-accent"
                  >
                    <Checkbox
                      :id="checkbox.id"
                      :checked="checkbox.to_do.checked"
                      class="mt-1 h-5 w-5"
                      @update:checked="onTodoUpdate(checkbox, $event)"
                    />
                    <label :for="checkbox.id" class="flex-1 text-sm leading-relaxed cursor-pointer flex items-start gap-2">
                      <span>
                        {{
                          checkbox.to_do.rich_text.length > 0
                            ? checkbox.to_do.rich_text[0].plain_text
                            : ''
                        }}
                      </span>
                      <a
                        :href="parseBlockLink(checkbox.id, item.page.id)"
                        target="_blank"
                        class="text-muted-foreground hover:text-primary inline-flex"
                        @click.stop
                      >
                        <ExternalLink class="w-4 h-4" />
                      </a>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <Sidebar side="right" collapsible="offcanvas">
        <SidebarHeader>
          <h2 class="text-lg font-semibold">
            Settings
          </h2>
        </SidebarHeader>

        <SidebarContent>
          <div class="space-y-6 p-4">
            <!-- Progress Card -->
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="text-3xl font-bold">
                    {{ percentage.toFixed(1) }}%
                    <span class="text-lg text-muted-foreground">
                      ({{ metrics.checked }}/{{ metrics.total }})
                    </span>
                  </div>
                  <Progress :value="percentage" class="w-full" />
                  <div class="text-xl font-medium">
                    {{ metrics.unchecked }} Remaining
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Extraction Info Card -->
            <Card v-if="data?.metadata">
              <CardHeader>
                <CardTitle>Extraction Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Total Pages:</span>
                    <span class="font-medium">{{ data.metadata.totalPages }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Total Checkboxes:</span>
                    <span class="font-medium">{{ data.metadata.totalCheckboxes }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Pages with Todos:</span>
                    <span class="font-medium">{{ data.metadata.pagesWithCheckboxes }}</span>
                  </div>
                  <div v-if="data.metadata.limits" class="mt-3 pt-3 border-t">
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Tier:</span>
                      <span class="font-medium capitalize">{{ data.metadata.limits.tier }}</span>
                    </div>
                    <div v-if="data.metadata.limits.maxPages" class="flex justify-between">
                      <span class="text-muted-foreground">Page Limit:</span>
                      <span class="font-medium">{{ data.metadata.limits.maxPages }}</span>
                    </div>
                  </div>
                  <div v-if="!data.metadata.extractionComplete" class="mt-2 p-2 bg-yellow-50 rounded-md">
                    <p class="text-xs text-yellow-800">
                      <template v-if="data.metadata.limits?.reachedPageLimit">
                        ⚠️ Page limit reached ({{ data.metadata.limits.tier }} tier: {{ data.metadata.limits.maxPages }} pages max)
                      </template>
                      <template v-else>
                        ⚠️ Some data may be missing due to extraction limits
                      </template>
                    </p>
                    <p v-if="data.metadata.limits?.tier === 'free'" class="text-xs text-yellow-700 mt-1">
                      Upgrade to Pro for up to 100 pages or Max for up to 500 pages.
                      <NuxtLink to="/settings" class="underline hover:text-yellow-900">
                        View plans
                      </NuxtLink>
                    </p>
                  </div>
                  <div v-if="data.metadata.errors.length > 0" class="mt-2 p-2 bg-red-50 rounded-md">
                    <p class="text-xs text-red-800 mb-1">
                      Extraction errors:
                    </p>
                    <ul class="text-xs text-red-700 list-disc list-inside">
                      <li v-for="(error, index) in data.metadata.errors" :key="index">
                        {{ error }}
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <!-- Show Checked Toggle -->
            <div class="flex items-center justify-between">
              <label for="show-checked" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Show Checked Items
              </label>
              <Checkbox
                id="show-checked"
                :checked="showChecked"
                @update:checked="showChecked = $event"
              />
            </div>

            <!-- Notion Sync Section -->
            <div>
              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle>Sync to Notion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="space-y-4">
                    <Button
                      class="w-full"
                      :disabled="syncLoading"
                      @click="syncToNotion"
                    >
                      <RotateCw :class="{ 'animate-spin': syncLoading }" class="w-4 h-4 mr-2" />
                      Sync to Notion Database
                    </Button>

                    <div v-if="lastSyncDate" class="text-sm text-muted-foreground">
                      Last synced: {{ formatDate(lastSyncDate) }}
                    </div>

                    <div v-if="syncDatabaseId" class="text-sm">
                      <a
                        :href="`https://notion.so/${syncDatabaseId.replace(/-/g, '')}`"
                        target="_blank"
                        class="text-primary hover:underline flex items-center gap-1"
                      >
                        View Sync Database
                        <ExternalLink class="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    </div>

    <!-- Sync Dialog -->
    <Dialog v-model:open="showSyncDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Sync Database</DialogTitle>
          <DialogDescription>
            To create a sync database, please provide the Notion page where you want the database to be created.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label for="pageId" class="text-sm font-medium">Parent Page URL or ID</label>
            <Input
              id="pageId"
              v-model="syncParentPageId"
              placeholder="Paste Notion page URL or ID"
            />
            <p class="text-xs text-muted-foreground">
              You can paste a Notion page URL (e.g., notion.so/workspace/page-id) or just the page ID
            </p>
            <p class="text-xs text-yellow-600 mt-2">
              ⚠️ Make sure the page is shared with your Notion integration
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            @click="showSyncDialog = false"
          >
            Cancel
          </Button>
          <Button
            :disabled="!syncParentPageId || syncLoading"
            @click="syncToNotion"
          >
            <RotateCw :class="{ 'animate-spin': syncLoading }" class="w-4 h-4 mr-2" />
            Create & Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<style scoped></style>
