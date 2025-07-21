import { useTodosStore } from '~/stores/todos';
import type { Todo, TodoFilter } from '~/stores/todos';

export interface UseTodosOptions {
  listId?: string
  autoSync?: boolean
  syncInterval?: number // in milliseconds
}

export function useTodos (options: UseTodosOptions = {}) {
  const store = useTodosStore();
  const { autoSync = true, syncInterval = 5 * 60 * 1000 } = options; // 5 minutes default

  // Set current list if provided
  if (options.listId) {
    store.setCurrentList(options.listId);
  }

  // Auto-sync setup
  let syncTimer: NodeJS.Timeout | null = null;

  const startAutoSync = () => {
    if (!autoSync || !store.currentListId) { return; }

    stopAutoSync();
    syncTimer = setInterval(() => {
      if (store.currentListId && store.needsSync) {
        store.fetchTodos(store.currentListId);
      }
    }, syncInterval);
  };

  const stopAutoSync = () => {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  };

  // Start auto-sync when component mounts
  onMounted(() => {
    startAutoSync();
  });

  // Stop auto-sync when component unmounts
  onUnmounted(() => {
    stopAutoSync();
  });

  // Watch for list changes
  watch(() => store.currentListId, () => {
    if (store.currentListId) {
      store.fetchTodos(store.currentListId);
      startAutoSync();
    } else {
      stopAutoSync();
    }
  });

  // Helper functions
  const toggleTodo = async (todo: Todo) => {
    try {
      await store.syncToNotion(todo.id, !todo.checked);
    } catch (error) {
      // Error is handled in the store
      console.error('Failed to toggle todo:', error);
    }
  };

  const refreshTodos = async () => {
    if (!store.currentListId) { return; }
    await store.fetchTodos(store.currentListId, true);
  };

  const applyFilter = (filter: Partial<TodoFilter>) => {
    store.setFilter(filter);
  };

  const clearFilter = () => {
    store.clearFilter();
  };

  // Progress tracking
  const progress = computed(() => {
    const total = store.totalCount;
    if (total === 0) { return 0; }
    return Math.round((store.completedCount / total) * 100);
  });

  const stats = computed(() => ({
    total: store.totalCount,
    completed: store.completedCount,
    pending: store.totalCount - store.completedCount,
    progress: progress.value
  }));

  return {
    // State
    todos: computed(() => store.filteredTodos),
    currentList: computed(() => store.currentList),
    lists: computed(() => store.lists),
    filter: computed(() => store.filter),
    tags: computed(() => store.allTags),

    // Loading states
    isLoading: computed(() => store.isLoading),
    isSyncing: computed(() => store.isSyncing),
    error: computed(() => store.error),
    needsSync: computed(() => store.needsSync),

    // Stats
    stats,
    progress,

    // Actions
    toggleTodo,
    refreshTodos,
    applyFilter,
    clearFilter,
    setCurrentList: store.setCurrentList,
    createList: store.createList,
    deleteList: store.deleteList,
    fetchLists: store.fetchLists,

    // Sync control
    startAutoSync,
    stopAutoSync
  };
}

// Hook for managing a single todo list
export function useTodoList (listId: string) {
  const todos = useTodos({ listId });

  // Fetch todos on mount
  onMounted(async () => {
    if (!todos.todos.value.length) {
      await todos.refreshTodos();
    }
  });

  return todos;
}

// Hook for todo search/filtering
export function useTodoSearch () {
  const store = useTodosStore();
  const searchQuery = ref('');
  const selectedTags = ref<string[]>([]);
  const selectedPriority = ref<string>('');
  const showCompleted = ref(true);

  // Apply filters when they change
  watchEffect(() => {
    store.setFilter({
      searchQuery: searchQuery.value,
      tags: selectedTags.value.length ? selectedTags.value : undefined,
      priority: selectedPriority.value || undefined,
      checked: showCompleted.value ? undefined : false
    });
  });

  const clearSearch = () => {
    searchQuery.value = '';
    selectedTags.value = [];
    selectedPriority.value = '';
    showCompleted.value = true;
  };

  return {
    searchQuery,
    selectedTags,
    selectedPriority,
    showCompleted,
    clearSearch,
    hasActiveFilters: computed(() =>
      searchQuery.value !== '' ||
      selectedTags.value.length > 0 ||
      selectedPriority.value !== '' ||
      !showCompleted.value
    )
  };
}
