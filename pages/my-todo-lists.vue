<script setup lang="ts">
import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { Trash2, Copy, Plus, Search, Check, FileText, ExternalLink, RotateCw, Info } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const isConnected = ref(false);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const todoLists = ref<any[]>([]);
const showDeleteDialog = ref(false);
const currentTodoList = ref();
const isSearching = ref(false);
const isCheckingAuth = ref(true);
const isLoadingTodoLists = ref(true);
const syncingLists = ref<Record<string, boolean>>({});
const showSyncDialog = ref(false);
const syncParentPageId = ref('');
const currentSyncTodoList = ref<any>(null);

// Debounce search functionality
let searchTimeout: NodeJS.Timeout | null = null;

const route = useRoute();

onMounted(async () => {
  // Handle query parameters for connection feedback
  if (route.query.success === 'connected') {
    toast.success('Successfully connected to Notion!');
  } else if (route.query.error === 'connection_failed') {
    toast.error('Failed to connect to Notion. Please try again.');
  } else if (route.query.error === 'notion_cancelled') {
    toast.info('Notion connection was cancelled.');
  } else if (route.query.error === 'notion_error') {
    toast.error('An error occurred while connecting to Notion.');
  }

  // Set base URL for client-side link generation
  baseUrl.value = window.location.origin;

  // Check if user is connected to Notion
  isCheckingAuth.value = true;
  const { data } = await useFetch('/api/auth-notion');
  if (data.value?.is_auth) {
    isConnected.value = true;
  }
  isCheckingAuth.value = false;

  await fetchTodoLists();
});

const searchDatabases = async () => {
  if (!searchQuery.value) { return; }

  isSearching.value = true;
  const { data, error } = await useFetch('/api/search-notion', {
    query: { query: searchQuery.value }
  });

  if (error.value) {
    console.error(error.value);
    toast.error('Failed to search databases');
  } else {
    searchResults.value = data.value?.databases || [];
  }

  isSearching.value = false;
};

const getIcon = (option) => {
  if (option.icon) {
    const iconType = option.icon.type;
    const url = option.icon[iconType]?.url;
    return url;
  }
};

const addDatabase = async (database: DatabaseObjectResponse) => {
  const { error } = await useFetch('/api/todo-list', {
    method: 'POST',
    body: database
  });

  if (error.value) {
    console.error(error.value);
    toast.error('Failed to add database');
    return;
  }

  toast.success('Database added successfully');
  searchQuery.value = '';
  searchResults.value = [];
  fetchTodoLists();
};

const fetchTodoLists = async () => {
  isLoadingTodoLists.value = true;
  const { data, error } = await useFetch('/api/todo-list');

  if (error.value) {
    console.error(error.value);
    isLoadingTodoLists.value = false;
    return;
  }

  todoLists.value = data.value?.todo_lists || [];

  // If we have todo lists, the user must be connected
  if (todoLists.value.length > 0) {
    isConnected.value = true;
  }
  isLoadingTodoLists.value = false;
};

const handleTodoListName = (todoList: any) => {
  if (todoList.name) {
    return todoList.name;
  }
  return todoList.notion_database_id?.metadata?.title?.[0]?.plain_text || 'Untitled';
};

const connectNotion = () => {
  // Using the navigateTo to go to connect-notion page which will handle the OAuth flow
  navigateTo('/connect-notion');
};

const baseUrl = ref('');

const handleLink = (todoList: { todo_list_id: string }) => {
  const url = baseUrl.value || 'http://localhost:3000';
  const link = `${url}/todo-list/${todoList.todo_list_id}`;
  return link;
};

// Create reactive refs for each todo list link
const todoListLinks = ref<Record<string, string>>({});

// Watch todoLists and baseUrl to update links
watch([todoLists, baseUrl], () => {
  const newLinks: Record<string, string> = {};
  todoLists.value.forEach((todoList) => {
    newLinks[todoList.todo_list_id] = handleLink(todoList);
  });
  todoListLinks.value = newLinks;
}, { immediate: true });

// Watch searchQuery with debounce for auto-search
watch(searchQuery, (newQuery) => {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Clear results if query is empty
  if (!newQuery.trim()) {
    searchResults.value = [];
    return;
  }

  // Only search if connected
  if (!isConnected.value) {
    return;
  }

  // Set new timeout for debounced search
  searchTimeout = setTimeout(() => {
    searchDatabases();
  }, 500); // 500ms debounce
});

// Cleanup timeout on unmount
onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

const handleCopyLink = async (todoList: any) => {
  const link = handleLink(todoList);
  try {
    await navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  } catch (err) {
    toast.error('Failed to copy link');
  }
};

const openInNewTab = (todoList: any) => {
  const link = handleLink(todoList);
  window.open(link, '_blank');
};

const handleDeleteModal = (todoList: any) => {
  currentTodoList.value = todoList;
  showDeleteDialog.value = true;
};

const deleteTodoList = async () => {
  if (!currentTodoList.value) { return; }

  const { error } = await useFetch(`/api/todo-list/${currentTodoList.value.todo_list_id}`, {
    method: 'DELETE'
  });

  if (error.value) {
    console.error(error.value);
    toast.error('Failed to delete todo list');
    return;
  }

  toast.success('Todo list deleted successfully');
  showDeleteDialog.value = false;
  currentTodoList.value = null;
  fetchTodoLists();
};

const syncToNotion = async (todoList: any) => {
  const todoListId = todoList.todo_list_id;

  if (!todoList.notion_sync_database_id && !syncParentPageId.value) {
    currentSyncTodoList.value = todoList;
    showSyncDialog.value = true;
    return;
  }

  syncingLists.value[todoListId] = true;

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
        todo_list_id: todoListId,
        parent_page_id: syncParentPageId.value ? extractNotionPageId(syncParentPageId.value) : undefined
      }
    });

    if (response.success) {
      toast.success('Sync Successful', {
        description: `Created: ${response.syncResults.created}, Updated: ${response.syncResults.updated}`
      });

      // Refresh todo lists to get updated sync info
      await fetchTodoLists();
      showSyncDialog.value = false;
      syncParentPageId.value = '';
      currentSyncTodoList.value = null;
    }
  } catch (error: any) {
    toast.error('Sync Failed', {
      description: error.message || 'Failed to sync to Notion'
    });
  } finally {
    syncingLists.value[todoListId] = false;
  }
};

const formatDate = (date: string | null) => {
  if (!date) { return 'Never'; }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(date));
};

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
</script>

<template>
  <div class="space-y-6">
    <!-- Get Started Here! Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">
          Get Started Here!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <p class="text-muted-foreground">
            You are one step away from creating your first to-do list. Connect your Notion account to fetch all your checkboxes and checkify your Notion databases.
          </p>
          <div class="flex items-center gap-3">
            <Button size="default" @click="connectNotion">
              <img src="/notion-logo.svg" alt="Notion" class="w-4 h-4 mr-2">
              Connect Notion
            </Button>
            <div v-if="isCheckingAuth" class="flex items-center gap-2 text-muted-foreground">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Checking connection...</span>
            </div>
            <span v-else-if="isConnected" class="text-green-600 flex items-center gap-2">
              <Check class="w-5 h-5" />
              You are connected
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Add Database Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">
          Add Database
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <p class="text-muted-foreground">
            Search for and select the database that you'll be creating your to-do list from.
          </p>

          <div class="mt-4">
            <Input
              v-model="searchQuery"
              placeholder="Search for a database"
              :disabled="!isConnected"
              class="w-full"
            />
          </div>

          <!-- Loading State -->
          <div v-if="isSearching" class="flex items-center justify-center py-8">
            <div class="flex items-center gap-2 text-muted-foreground">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Searching databases...</span>
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="space-y-2 mt-4">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              @click="addDatabase(result)"
            >
              <div class="flex items-center gap-2">
                <img v-if="getIcon(result)" :src="getIcon(result)" class="w-5 h-5">
                <span>{{ result.title[0]?.plain_text || 'Untitled' }}</span>
              </div>
              <Plus class="w-4 h-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- My Todo Lists Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">
          My Todo Lists
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <p class="text-muted-foreground">
            Here are all the to-do lists you've created. Click the URL to open it, use the copy button to copy the link, or click the external link button to open in a new tab.
          </p>

          <!-- Todo Lists Grid -->
          <ClientOnly>
            <!-- Loading State -->
            <div v-if="isLoadingTodoLists" class="flex items-center justify-center py-8">
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Loading your todo lists...</span>
              </div>
            </div>

            <!-- Todo Lists -->
            <div v-else-if="todoLists.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <Card v-for="todoList in todoLists" :key="todoList.todo_list_id">
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <img
                        v-if="getIcon(todoList.notion_database_id?.metadata)"
                        :src="getIcon(todoList.notion_database_id?.metadata)"
                        :alt="handleTodoListName(todoList)"
                        class="w-5 h-5"
                      >
                      <FileText v-else class="w-5 h-5 text-gray-500" />
                      <CardTitle class="text-lg">
                        {{ handleTodoListName(todoList) }}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      @click="handleDeleteModal(todoList)"
                    >
                      <Trash2 class="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent class="space-y-4">
                  <!-- Todo List Link -->
                  <div class="space-y-2">
                    <Input
                      :model-value="todoListLinks[todoList.todo_list_id]"
                      readonly
                      class="w-full text-sm cursor-pointer hover:bg-accent/50 transition-colors"
                      title="Click to open in new tab"
                      @click="openInNewTab(todoList)"
                    />
                    <div class="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        class="flex-1"
                        title="Copy link"
                        @click="handleCopyLink(todoList)"
                      >
                        <Copy class="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        class="flex-1"
                        title="Open in new tab"
                        @click="openInNewTab(todoList)"
                      >
                        <ExternalLink class="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </div>

                  <!-- Sync to Notion -->
                  <div class="space-y-2">
                    <Separator />
                    <Button
                      size="sm"
                      class="w-full"
                      :disabled="syncingLists[todoList.todo_list_id]"
                      @click="syncToNotion(todoList)"
                    >
                      <RotateCw :class="{ 'animate-spin': syncingLists[todoList.todo_list_id] }" class="w-4 h-4 mr-2" />
                      Sync to Notion
                    </Button>

                    <div v-if="todoList.last_sync_date" class="text-xs text-muted-foreground text-center">
                      Last synced: {{ formatDate(todoList.last_sync_date) }}
                    </div>
                  </div>

                  <!-- Extraction Info -->
                  <div v-if="todoList.extraction_metadata" class="space-y-2">
                    <Separator />
                    <div class="text-sm space-y-1">
                      <div class="flex items-center gap-2 mb-1">
                        <Info class="w-3 h-3 text-muted-foreground" />
                        <span class="font-medium text-xs">Extraction Info</span>
                      </div>
                      <div class="space-y-1 text-xs">
                        <div class="flex justify-between">
                          <span class="text-muted-foreground">Pages:</span>
                          <span class="font-medium">{{ todoList.extraction_metadata.totalPages || 0 }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-muted-foreground">Checkboxes:</span>
                          <span class="font-medium">{{ todoList.extraction_metadata.totalCheckboxes || 0 }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-muted-foreground">With Todos:</span>
                          <span class="font-medium">{{ todoList.extraction_metadata.pagesWithCheckboxes || 0 }}</span>
                        </div>
                        <div v-if="todoList.extraction_metadata.limits" class="mt-2 pt-2 border-t">
                          <div class="flex justify-between">
                            <span class="text-muted-foreground">Tier:</span>
                            <span class="font-medium capitalize">{{ todoList.extraction_metadata.limits.tier }}</span>
                          </div>
                          <div v-if="todoList.extraction_metadata.limits.maxPages" class="flex justify-between">
                            <span class="text-muted-foreground">Limit:</span>
                            <span class="font-medium">{{ todoList.extraction_metadata.limits.maxPages }} pages</span>
                          </div>
                        </div>
                        <div v-if="!todoList.extraction_metadata.extractionComplete" class="mt-1 p-1 bg-yellow-50 rounded">
                          <p class="text-xs text-yellow-800">
                            <template v-if="todoList.extraction_metadata.limits?.reachedPageLimit">
                              ⚠️ Page limit reached
                              <NuxtLink v-if="todoList.extraction_metadata.limits?.tier === 'free'" to="/settings" class="underline hover:text-yellow-900">
                                Upgrade
                              </NuxtLink>
                            </template>
                            <template v-else>
                              ⚠️ Incomplete extraction
                            </template>
                          </p>
                        </div>
                        <div v-if="todoList.extraction_metadata.errors && todoList.extraction_metadata.errors.length > 0" class="mt-1 p-1 bg-red-50 rounded">
                          <p class="text-xs text-red-800">
                            {{ todoList.extraction_metadata.errors.length }} extraction error(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- View Sync Database Button -->
                  <div v-if="todoList.notion_sync_database_id">
                    <Button
                      size="sm"
                      variant="outline"
                      class="w-full"
                      as="a"
                      :href="`https://notion.so/${todoList.notion_sync_database_id.replace(/-/g, '')}`"
                      target="_blank"
                    >
                      <ExternalLink class="w-4 h-4 mr-2" />
                      View Sync Database
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Empty State -->
            <div v-else-if="!isLoadingTodoLists" class="text-center py-8">
              <p class="text-muted-foreground">
                You haven't created any to-do lists yet.
              </p>
            </div>
          </ClientOnly>
        </div>
      </CardContent>
    </Card>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Todo List</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ currentTodoList ? handleTodoListName(currentTodoList) : '' }}"?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            Cancel
          </Button>
          <Button variant="destructive" @click="deleteTodoList">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Sync Dialog -->
    <Dialog v-model:open="showSyncDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Sync Database</DialogTitle>
          <DialogDescription>
            To create a sync database for "{{ currentSyncTodoList ? handleTodoListName(currentSyncTodoList) : '' }}", please provide the Notion page where you want the database to be created.
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
            :disabled="!syncParentPageId || syncingLists[currentSyncTodoList?.todo_list_id]"
            @click="syncToNotion(currentSyncTodoList)"
          >
            <RotateCw :class="{ 'animate-spin': syncingLists[currentSyncTodoList?.todo_list_id] }" class="w-4 h-4 mr-2" />
            Create & Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
