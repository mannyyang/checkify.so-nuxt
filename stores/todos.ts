import { defineStore } from 'pinia';

export interface Todo {
  id: string
  text: string
  checked: boolean
  blockId: string
  databaseId: string
  pageId: string
  pageTitle?: string
  pageUrl?: string
  tags?: string[]
  priority?: 'high' | 'medium' | 'low'
  dueDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface TodoList {
  todo_list_id: string
  user_id: string
  notion_database_id: string
  created_at: string
  updated_at: string
  metadata?: {
    name?: string
    icon?: string
    description?: string
  }
}

export interface TodoFilter {
  databaseId?: string
  tags?: string[]
  priority?: string
  checked?: boolean
  searchQuery?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority'
  sortOrder?: 'asc' | 'desc'
}

interface TodosState {
  lists: TodoList[]
  todos: Map<string, Todo[]> // Map of listId to todos
  currentListId: string | null
  filter: TodoFilter
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  lastSyncAt: Map<string, Date> // Map of listId to last sync time
}

export const useTodosStore = defineStore('todos', {
  state: (): TodosState => ({
    lists: [],
    todos: new Map(),
    currentListId: null,
    filter: {},
    isLoading: false,
    isSyncing: false,
    error: null,
    lastSyncAt: new Map()
  }),

  getters: {
    currentList: (state): TodoList | null => {
      if (!state.currentListId) { return null; }
      return state.lists.find(list => list.todo_list_id === state.currentListId) || null;
    },

    currentTodos: (state): Todo[] => {
      if (!state.currentListId) { return []; }
      return state.todos.get(state.currentListId) || [];
    },

    filteredTodos: (state): Todo[] => {
      const currentListId = state.currentListId;
      if (!currentListId) { return []; }
      let todos = state.todos.get(currentListId) || [];

      // Apply filters
      if (state.filter.checked !== undefined) {
        todos = todos.filter((todo: Todo) => todo.checked === state.filter.checked);
      }

      if (state.filter.tags?.length) {
        todos = todos.filter((todo: Todo) =>
          todo.tags?.some((tag: string) => state.filter.tags?.includes(tag))
        );
      }

      if (state.filter.priority) {
        todos = todos.filter((todo: Todo) => todo.priority === state.filter.priority);
      }

      if (state.filter.searchQuery) {
        const query = state.filter.searchQuery.toLowerCase();
        todos = todos.filter((todo: Todo) =>
          todo.text.toLowerCase().includes(query) ||
          todo.pageTitle?.toLowerCase().includes(query) ||
          todo.tags?.some((tag: string) => tag.toLowerCase().includes(query))
        );
      }

      // Apply sorting
      const sortBy = state.filter.sortBy || 'createdAt';
      const sortOrder = state.filter.sortOrder || 'desc';

      todos.sort((a: Todo, b: Todo) => {
        let aVal: any = a[sortBy as keyof Todo];
        let bVal: any = b[sortBy as keyof Todo];

        if (sortBy === 'priority') {
          const priorityOrder = { high: 3, medium: 2, low: 1, undefined: 0 };
          aVal = priorityOrder[aVal as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[bVal as keyof typeof priorityOrder] || 0;
        }

        if (aVal === bVal) { return 0; }
        if (aVal === undefined) { return 1; }
        if (bVal === undefined) { return -1; }

        const result = aVal < bVal ? -1 : 1;
        return sortOrder === 'asc' ? result : -result;
      });

      return todos;
    },

    completedCount: (state): number => {
      if (!state.currentListId) { return 0; }
      const todos = state.todos.get(state.currentListId) || [];
      return todos.filter((todo: Todo) => todo.checked).length;
    },

    totalCount: (state): number => {
      if (!state.currentListId) { return 0; }
      const todos = state.todos.get(state.currentListId) || [];
      return todos.length;
    },

    allTags: (state): string[] => {
      const tags = new Set<string>();
      if (!state.currentListId) { return []; }
      const todos = state.todos.get(state.currentListId) || [];
      todos.forEach((todo: Todo) => {
        todo.tags?.forEach((tag: string) => tags.add(tag));
      });
      return Array.from(tags).sort();
    },

    needsSync: (state): boolean => {
      if (!state.currentListId) { return false; }
      const lastSync = state.lastSyncAt.get(state.currentListId);
      if (!lastSync) { return true; }

      // Check if it's been more than 5 minutes since last sync
      const fiveMinutes = 5 * 60 * 1000;
      return Date.now() - lastSync.getTime() > fiveMinutes;
    }
  },

  actions: {
    setLists (lists: TodoList[]) {
      this.lists = lists;
    },

    setCurrentList (listId: string | null) {
      this.currentListId = listId;
    },

    setTodos (listId: string, todos: Todo[]) {
      this.todos.set(listId, todos);
      this.lastSyncAt.set(listId, new Date());
    },

    updateTodo (todoId: string, updates: Partial<Todo>) {
      if (!this.currentListId) { return; }

      const todos = this.todos.get(this.currentListId) || [];
      const index = todos.findIndex(todo => todo.id === todoId);

      if (index !== -1) {
        todos[index] = { ...todos[index], ...updates };
        this.todos.set(this.currentListId, [...todos]);
      }
    },

    removeTodo (todoId: string) {
      if (!this.currentListId) { return; }

      const todos = this.todos.get(this.currentListId) || [];
      const filtered = todos.filter(todo => todo.id !== todoId);
      this.todos.set(this.currentListId, filtered);
    },

    setFilter (filter: Partial<TodoFilter>) {
      this.filter = { ...this.filter, ...filter };
    },

    clearFilter () {
      this.filter = {};
    },

    async fetchLists () {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch('/api/todo-list', {
          method: 'GET'
        });

        if (response && typeof response === 'object') {
          if ('data' in response && response.data && typeof response.data === 'object' && 'todo_lists' in response.data) {
            this.setLists((response.data as any).todo_lists);
          } else if ('todo_lists' in response) {
            this.setLists((response as any).todo_lists);
          }
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to fetch todo lists';
        console.error('Error fetching lists:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchTodos (listId: string, force = false) {
      // Skip if we already have recent data and not forcing
      if (!force && !this.needsSync && this.todos.has(listId)) {
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch(`/api/todo-list/${listId}`, {
          method: 'GET'
        });

        if (response && typeof response === 'object') {
          if ('data' in response && response.data && typeof response.data === 'object' && 'todos' in response.data) {
            this.setTodos(listId, (response.data as any).todos);
          } else if ('todos' in response) {
            this.setTodos(listId, (response as any).todos);
          }
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to fetch todos';
        console.error('Error fetching todos:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async syncToNotion (todoId: string, checked: boolean) {
      if (!this.currentListId) { return; }

      this.isSyncing = true;
      this.error = null;

      // Optimistically update the UI
      this.updateTodo(todoId, { checked });

      try {
        await $fetch('/api/todo-list/sync-to-notion', {
          method: 'POST',
          body: {
            listId: this.currentListId,
            todoId,
            checked
          }
        });
      } catch (error: any) {
        // Revert on error
        this.updateTodo(todoId, { checked: !checked });
        this.error = error.data?.message || 'Failed to sync with Notion';
        console.error('Error syncing to Notion:', error);
        throw error;
      } finally {
        this.isSyncing = false;
      }
    },

    async createList (databaseId: string) {
      try {
        const response = await $fetch('/api/todo-list', {
          method: 'POST',
          body: { notion_database_id: databaseId }
        });
        const data = response && typeof response === 'object' && 'data' in response ? response.data : response;

        if (data && typeof data === 'object' && 'todo_list' in data) {
          this.lists.push((data as any).todo_list);
          return (data as any).todo_list;
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to create todo list';
        throw error;
      }
    },

    async deleteList (listId: string) {
      try {
        await $fetch(`/api/todo-list/${listId}`, {
          method: 'DELETE'
        });

        // Remove from local state
        this.lists = this.lists.filter(list => list.todo_list_id !== listId);
        this.todos.delete(listId);
        this.lastSyncAt.delete(listId);

        if (this.currentListId === listId) {
          this.currentListId = null;
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to delete todo list';
        throw error;
      }
    },

    reset () {
      this.lists = [];
      this.todos.clear();
      this.currentListId = null;
      this.filter = {};
      this.isLoading = false;
      this.isSyncing = false;
      this.error = null;
      this.lastSyncAt.clear();
    }
  }
});
