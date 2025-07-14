<script setup lang="ts">
import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Copy, Plus, Search, Info, Check, FileText } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const isConnected = ref(false);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const todoLists = ref<any[]>([]);
const showDeleteDialog = ref(false);
const currentTodoList = ref();
const isSearching = ref(false);

// Debounce search functionality
let searchTimeout: NodeJS.Timeout | null = null;

onMounted(async () => {
  // Set base URL for client-side link generation
  baseUrl.value = window.location.origin;
  
  // Check if user is connected to Notion
  const { data } = await useFetch('/api/auth-notion');
  if (data.value?.is_auth) {
    isConnected.value = true;
  }
  await fetchTodoLists();
});

const searchDatabases = async () => {
  if (!searchQuery.value) return;
  
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
  const { data, error } = await useFetch('/api/todo-list');

  if (error.value) {
    console.error(error.value);
    return;
  }

  todoLists.value = data.value?.todo_lists || [];
  
  // If we have todo lists, the user must be connected
  if (todoLists.value.length > 0) {
    isConnected.value = true;
  }
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
  todoLists.value.forEach(todoList => {
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

const handleDeleteModal = (todoList: any) => {
  currentTodoList.value = todoList;
  showDeleteDialog.value = true;
};

const deleteTodoList = async () => {
  if (!currentTodoList.value) return;

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
</script>

<template>
  <div class="space-y-6">
    <!-- Get Started Here! Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Get Started Here!</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-muted-foreground">
            <Info class="w-6 h-6 text-primary shrink-0" />
            <p>You are one step away from creating your first to-do list. Connect your Notion account to fetch all your checkboxes and checkify your Notion databases.</p>
          </div>
          <div class="flex items-center gap-3">
            <Button size="default" @click="connectNotion">
              <img src="/notion-logo.svg" alt="Notion" class="w-4 h-4 mr-2" />
              Connect Notion
            </Button>
            <span v-if="isConnected" class="text-green-600 flex items-center gap-2">
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
        <CardTitle class="text-2xl">Add Database</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-muted-foreground">
            <Info class="w-6 h-6 text-primary shrink-0" />
            <p>Search for and select the database that you'll be creating your to-do list from.</p>
          </div>
          
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
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Searching databases...</span>
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="space-y-2 mt-4">
            <div v-for="result in searchResults" :key="result.id" 
                 class="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                 @click="addDatabase(result)">
              <div class="flex items-center gap-2">
                <img v-if="getIcon(result)" :src="getIcon(result)" class="w-5 h-5" />
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
        <CardTitle class="text-2xl">My Todo Lists</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-muted-foreground">
            <Info class="w-6 h-6 text-primary shrink-0" />
            <p>Here are all the to-do lists you've created. Click on the copy icon to copy the link for an embed. The first 45 pages in a database are used and the first 50 blocks in a page are used.</p>
          </div>

          <!-- Todo Lists Grid -->
          <ClientOnly>
            <div v-if="todoLists.length > 0" class="mt-6">
            <div v-for="todoList in todoLists" :key="todoList.todo_list_id" class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <img
                  v-if="getIcon(todoList.notion_database_id?.metadata)"
                  :src="getIcon(todoList.notion_database_id?.metadata)"
                  :alt="handleTodoListName(todoList)"
                  class="w-5 h-5"
                />
                <FileText v-else class="w-5 h-5 text-gray-500" />
                <span class="font-medium">{{ handleTodoListName(todoList) }}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6 ml-auto"
                  @click="handleDeleteModal(todoList)"
                >
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div class="flex gap-2 items-center">
                <Input :model-value="todoListLinks[todoList.todo_list_id]" readonly class="flex-1 text-sm" />
                <Button
                  variant="secondary"
                  size="icon"
                  @click="handleCopyLink(todoList)"
                  class="shrink-0"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <p class="text-muted-foreground">You haven't created any to-do lists yet.</p>
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
          <Button variant="outline" @click="showDeleteDialog = false">Cancel</Button>
          <Button variant="destructive" @click="deleteTodoList">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>