import type { ToDoBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { ref, computed } from 'vue';

interface TodoPage {
  page: any;
  checkboxes: ToDoBlockObjectResponse[];
  metadata?: {
    totalBlocks: number;
    wasLimited: boolean;
  };
}

interface ProgressInfo {
  totalPages: number;
  processedPages: number;
  totalCheckboxes: number;
  percentComplete?: number;
}

interface TodoListMetadata {
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
}

interface SyncInfo {
  syncDatabaseId: string | null;
  lastSyncDate: string | null;
}

/**
 * Composable for progressive loading of todos using Server-Sent Events
 * Streams data from the backend as it's fetched from Notion API
 */
export function useProgressiveTodos(todoListId: string) {
  const pages = ref<TodoPage[]>([]);
  const progress = ref<ProgressInfo>({
    totalPages: 0,
    processedPages: 0,
    totalCheckboxes: 0,
    percentComplete: 0
  });
  const metadata = ref<TodoListMetadata | null>(null);
  const syncInfo = ref<SyncInfo | null>(null);
  const isLoading = ref(false);
  const isComplete = ref(false);
  const error = ref<string | null>(null);

  let eventSource: EventSource | null = null;

  /**
   * Start streaming todos from the backend
   */
  const startStreaming = () => {
    // Reset state
    pages.value = [];
    progress.value = {
      totalPages: 0,
      processedPages: 0,
      totalCheckboxes: 0,
      percentComplete: 0
    };
    metadata.value = null;
    syncInfo.value = null;
    isLoading.value = true;
    isComplete.value = false;
    error.value = null;

    // Create EventSource connection
    const url = `/api/todo-list/${todoListId}/stream`;
    eventSource = new EventSource(url);

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      try {
        const chunk = JSON.parse(event.data);

        switch (chunk.type) {
          case 'progress':
            progress.value = chunk.payload;
            break;

          case 'data':
            // Append new pages to the list
            pages.value.push(...chunk.payload.pages);
            break;

          case 'metadata':
            metadata.value = chunk.payload.metadata;
            syncInfo.value = chunk.payload.syncInfo;
            break;

          case 'complete':
            isLoading.value = false;
            isComplete.value = true;
            stopStreaming();
            break;

          case 'error':
            error.value = chunk.payload.message;
            isLoading.value = false;
            stopStreaming();
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
        error.value = 'Failed to parse server response';
      }
    };

    // Handle connection errors
    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      error.value = 'Connection to server lost';
      isLoading.value = false;
      stopStreaming();
    };
  };

  /**
   * Stop streaming and close the connection
   */
  const stopStreaming = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  /**
   * Computed property for loading state message
   */
  const loadingMessage = computed(() => {
    if (!isLoading.value) return '';

    const { processedPages, totalPages, percentComplete } = progress.value;
    if (totalPages === 0) return 'Initializing...';

    return `Loading ${processedPages} of ${totalPages} pages (${percentComplete}%)`;
  });

  /**
   * Computed property for metrics
   */
  const metrics = computed(() => {
    let checked = 0;
    let unchecked = 0;
    let total = 0;

    pages.value.forEach((page) => {
      page.checkboxes.forEach((checkbox) => {
        if (checkbox.to_do.checked) {
          checked++;
        } else {
          unchecked++;
        }
        total++;
      });
    });

    return { checked, unchecked, total };
  });

  /**
   * Computed property for completion percentage
   */
  const completionPercentage = computed(() => {
    const { checked, total } = metrics.value;
    return total > 0 ? (checked / total) * 100 : 0;
  });

  // Cleanup on unmount
  onUnmounted(() => {
    stopStreaming();
  });

  return {
    // State
    pages,
    progress,
    metadata,
    syncInfo,
    isLoading,
    isComplete,
    error,

    // Computed
    loadingMessage,
    metrics,
    completionPercentage,

    // Methods
    startStreaming,
    stopStreaming
  };
}
