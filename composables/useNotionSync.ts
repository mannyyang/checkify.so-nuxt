import { useApi, useApiMutation } from './useApi';
import { useUserStore } from '~/stores/user';
import type { NotionDatabase, NotionConnectResponse } from '~/types/api';

export interface UseNotionSyncOptions {
  onConnected?: (response: NotionConnectResponse) => void
  onDisconnected?: () => void
  onError?: (error: any) => void
}

export function useNotionSync (options: UseNotionSyncOptions = {}) {
  const userStore = useUserStore();
  const router = useRouter();

  // Connection state
  const isConnecting = ref(false);
  const isDisconnecting = ref(false);
  const error = ref<string | null>(null);

  // API mutations
  const connectApi = useApiMutation<{ code: string; redirect_uri: string }, NotionConnectResponse>(
    '/api/connect-notion',
    {
      method: 'POST',
      onSuccess: (data) => {
        userStore.fetchNotionAuth();
        if (options.onConnected) {
          options.onConnected(data);
        }
      },
      onError: (err) => {
        error.value = err.message;
        if (options.onError) {
          options.onError(err);
        }
      }
    }
  );

  const disconnectApi = useApiMutation('/api/notion/disconnect', {
    method: 'POST',
    onSuccess: () => {
      userStore.setNotionAuth(null);
      if (options.onDisconnected) {
        options.onDisconnected();
      }
    },
    onError: (err) => {
      error.value = err.message;
      if (options.onError) {
        options.onError(err);
      }
    }
  });

  // OAuth flow
  const initiateOAuth = () => {
    const clientId = useRuntimeConfig().public.notionClientId;
    const redirectUri = `${window.location.origin}/api/auth-notion`;

    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId as string);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('owner', 'user');
    authUrl.searchParams.append('redirect_uri', redirectUri);

    window.location.href = authUrl.toString();
  };

  // Handle OAuth callback
  const handleOAuthCallback = async (code: string) => {
    isConnecting.value = true;
    error.value = null;

    try {
      const redirectUri = `${window.location.origin}/api/auth-notion`;
      const response = await connectApi.mutate({ code, redirect_uri: redirectUri });

      if (response) {
        // Redirect to dashboard or settings
        await router.push('/dashboard');
      }
    } finally {
      isConnecting.value = false;
    }
  };

  // Disconnect Notion
  const disconnect = async () => {
    if (isDisconnecting.value) { return; }

    isDisconnecting.value = true;
    error.value = null;

    try {
      await disconnectApi.mutate();
    } finally {
      isDisconnecting.value = false;
    }
  };

  // Check if connected
  const isConnected = computed(() => !!userStore.notionAuth);

  // Get workspace info
  const workspace = computed(() => {
    if (!userStore.notionAuth) { return null; }

    return {
      id: userStore.notionAuth.workspace_id,
      name: userStore.notionAuth.workspace_name || 'Unknown Workspace',
      icon: userStore.notionAuth.workspace_icon
    };
  });

  return {
    // State
    isConnected,
    isConnecting: computed(() => isConnecting.value || connectApi.loading.value),
    isDisconnecting: computed(() => isDisconnecting.value || disconnectApi.loading.value),
    error: computed(() => error.value || connectApi.error.value?.message || disconnectApi.error.value?.message),
    workspace,

    // Actions
    initiateOAuth,
    handleOAuthCallback,
    disconnect
  };
}

// Hook for searching Notion databases
export function useNotionDatabaseSearch () {
  const searchQuery = ref('');
  const debouncedQuery = refDebounced(searchQuery, 300);

  const searchApi = useApi<{ databases: NotionDatabase[] }>(
    computed(() => `/api/notion/search?query=${encodeURIComponent(debouncedQuery.value)}`),
    {
      immediate: false
    }
  );

  // Search when query changes
  watch(debouncedQuery, (query) => {
    if (query) {
      searchApi.execute();
    }
  });

  const databases = computed(() => searchApi.data.value?.databases || []);

  return {
    searchQuery,
    databases,
    isSearching: searchApi.loading,
    searchError: searchApi.error,
    refresh: searchApi.refresh
  };
}

// Hook for Notion webhook handling
export function useNotionWebhook () {
  const handleWebhook = useApiMutation('/api/notion-webhook', {
    method: 'POST'
  });

  return {
    processWebhook: handleWebhook.mutate,
    isProcessing: handleWebhook.loading,
    error: handleWebhook.error
  };
}

// Helper to format Notion database for display
export function useNotionDatabaseFormatter () {
  const formatDatabase = (database: NotionDatabase) => {
    const icon = database.icon;
    let iconDisplay = '📄';

    if (icon?.type === 'emoji') {
      iconDisplay = icon.emoji || '📄';
    } else if (icon?.type === 'external' || icon?.type === 'file') {
      iconDisplay = '🔗';
    }

    return {
      id: database.id,
      title: database.title || 'Untitled Database',
      icon: iconDisplay,
      iconUrl: icon?.external?.url || icon?.file?.url,
      isWorkspace: database.parent?.workspace === true,
      parentType: database.parent?.type
    };
  };

  return { formatDatabase };
}
