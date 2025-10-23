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
      tierSource?: string;
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

// Check if progressive loading is enabled
const useProgressive = computed(() => route.query.progressive === 'true');

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

// Progressive loading composable
const progressive = useProgressive.value
  ? useProgressiveTodos(route.params.todo_list_id as string)
  : null;

// Traditional loading
const { data, pending, refresh, error } = useFetch<TodoListData>(
  '/api/todo-list/' + route.params.todo_list_id,
  {
    lazy: true,
    server: false, // This ensures the fetch only happens on client side
    immediate: !useProgressive.value, // Only fetch immediately if not using progressive
    onResponseError ({ response }) {
      // Handle API errors
      if (response._data?.message) {
        if (response._data.message.includes('Could not find database')) {
          toast.error('Unable to access this Notion database. Please ensure it\'s shared with your Checkify integration.');
        } else if (response._data.message.includes('object_not_found')) {
          toast.error('This Notion database no longer exists or has been deleted.');
        } else {
          toast.error(`Error loading todos: ${response._data.message}`);
        }
      } else {
        toast.error('Failed to load todos. Please try refreshing the page.');
      }
    }
  }
);

// Start progressive loading if enabled
if (progressive) {
  onMounted(() => {
    progressive.startStreaming();
  });
}

const metrics = computed(() => {
  // Use progressive metrics if available
  if (progressive) {
    return progressive.metrics.value;
  }

  // Otherwise use traditional data
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
  const sourcePages = progressive ? progressive.pages.value : (data.value?.pages || []);

  return sourcePages.map((page) => {
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
});

const checkboxList = computed(() => {
  if (showChecked.value) {
    return progressive ? progressive.pages.value : (data.value?.pages || []);
  } else {
    return filtered.value;
  }
});

// Unified loading state
const isLoading = computed(() => {
  return progressive ? progressive.isLoading.value : pending.value;
});

// Unified error state
const loadError = computed(() => {
  return progressive ? progressive.error.value : (error.value ? 'Failed to load todos' : null);
});

// Unified metadata
const todoMetadata = computed(() => {
  return progressive ? progressive.metadata.value : data.value?.metadata;
});

// Set sync info when data loads
watchEffect(() => {
  const syncInfoSource = progressive ? progressive.syncInfo.value : data.value?.syncInfo;

  if (syncInfoSource) {
    syncDatabaseId.value = syncInfoSource.syncDatabaseId;
    lastSyncDate.value = syncInfoSource.lastSyncDate ? new Date(syncInfoSource.lastSyncDate) : null;
  }
});

// Refresh handler
const handleRefresh = () => {
  if (progressive) {
    progressive.startStreaming();
  } else {
    refresh();
  }
};

const onTodoUpdate = async (checkbox: ToDoBlockObjectResponse, checked: boolean) => {
  // Optimistically update local state
  checkbox.to_do.checked = checked;

  try {
    await $fetch('/api/set-checkbox', {
      method: 'POST',
      body: {
        checkbox,
        todo_list_id: route.params.todo_list_id
      }
    });

    toast.success('Todo updated');
  } catch (error: any) {
    // Revert on error
    checkbox.to_do.checked = !checked;
    toast.error('Failed to update todo', {
      description: error.data?.message || error.message || 'Please try again'
    });
  }
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
  handleRefresh();
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
  } catch (err: any) {
    toast.error('Sync Failed', {
      description: err.message || 'Failed to sync to Notion'
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
        <div class="flex items-center justify-between bg-background border-b p-4 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold pl-2">My Todos</span>
            <span v-if="useProgressive" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Progressive Mode
            </span>
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="isLoading"
              @click="handleRefresh"
            >
              <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4 mr-2" />
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
          <!-- Progressive Loading Indicator -->
          <div v-if="progressive && progressive.isLoading.value && progressive.progress.value.totalPages > 0" class="mx-4 mb-4">
            <div class="bg-accent rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">{{ progressive.loadingMessage.value }}</span>
                <span class="text-sm text-muted-foreground">
                  {{ progressive.progress.value.totalCheckboxes }} todos found
                </span>
              </div>
              <Progress :value="progressive.progress.value.percentComplete || 0" class="w-full" />
            </div>
          </div>

          <div v-if="isLoading && checkboxList.length === 0" class="text-center py-12 text-muted-foreground">
            Loading todos...
          </div>
          <div v-else-if="loadError" class="text-center py-12">
            <div class="text-destructive font-semibold mb-2">
              Error Loading Todos
            </div>
            <div class="text-muted-foreground mb-4">
              {{ loadError }}
            </div>
            <Button variant="outline" size="sm" @click="handleRefresh">
              <RefreshCw class="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
          <div v-else-if="!isLoading && checkboxList.length === 0" class="text-center py-12 text-muted-foreground">
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

                <div class="space-y-1">
                  <div
                    v-for="checkbox in item.checkboxes"
                    :key="checkbox.id"
                    class="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-accent"
                  >
                    <Checkbox
                      :id="checkbox.id"
                      :model-value="checkbox.to_do.checked"
                      class="h-5 w-5"
                      @update:model-value="(value) => onTodoUpdate(checkbox, value as boolean)"
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
                        class="text-muted-foreground hover:text-primary inline-flex items-center pt-0.5"
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
            <Card v-if="todoMetadata">
              <CardHeader>
                <CardTitle>Extraction Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Total Pages:</span>
                    <span class="font-medium">{{ todoMetadata.totalPages }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Total Checkboxes:</span>
                    <span class="font-medium">{{ todoMetadata.totalCheckboxes }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Pages with Todos:</span>
                    <span class="font-medium">{{ todoMetadata.pagesWithCheckboxes }}</span>
                  </div>
                  <div v-if="todoMetadata.limits" class="mt-3 pt-3 border-t">
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Tier:</span>
                      <span class="font-medium capitalize">{{ todoMetadata.limits.tier }}</span>
                    </div>
                    <div v-if="todoMetadata.limits.tierSource" class="flex justify-between">
                      <span class="text-muted-foreground text-xs">Source:</span>
                      <span class="text-xs font-mono">{{ todoMetadata.limits.tierSource }}</span>
                    </div>
                    <div v-if="todoMetadata.limits.maxPages" class="flex justify-between">
                      <span class="text-muted-foreground">Page Limit:</span>
                      <span class="font-medium">{{ todoMetadata.limits.maxPages }}</span>
                    </div>
                  </div>
                  <div v-if="!todoMetadata.extractionComplete" class="mt-2 p-2 bg-yellow-50 rounded-md">
                    <p class="text-xs text-yellow-800">
                      <template v-if="todoMetadata.limits?.reachedPageLimit">
                        ⚠️ Page limit reached ({{ todoMetadata.limits.tier }} tier: {{ todoMetadata.limits.maxPages }} pages max)
                      </template>
                      <template v-else>
                        ⚠️ Some data may be missing due to extraction limits
                      </template>
                    </p>
                    <p v-if="todoMetadata.limits?.tier === 'free'" class="text-xs text-yellow-700 mt-1">
                      Upgrade to Pro for up to 100 pages or Max for up to 500 pages.
                      <NuxtLink to="/settings" class="underline hover:text-yellow-900">
                        View plans
                      </NuxtLink>
                    </p>
                    <p v-if="todoMetadata.limits?.tier === 'pro'" class="text-xs text-yellow-700 mt-1">
                      Upgrade to Max for up to 500 pages.
                      <NuxtLink to="/settings" class="underline hover:text-yellow-900">
                        Upgrade
                      </NuxtLink>
                    </p>
                  </div>
                  <div v-if="todoMetadata.errors.length > 0" class="mt-2 p-2 bg-red-50 rounded-md">
                    <p class="text-xs text-red-800 mb-1">
                      Extraction errors:
                    </p>
                    <ul class="text-xs text-red-700 list-disc list-inside">
                      <li v-for="(error, index) in todoMetadata.errors" :key="index">
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
                v-model="showChecked"
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
