import type { ApiResponse, ApiError } from '~/types/api';

export interface UseApiOptions<T = any> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: ApiError) => void
  transform?: (data: any) => T
}

export interface UseApiReturn<T = any> {
  data: Ref<T | null>
  error: Ref<ApiError | null>
  loading: Ref<boolean>
  execute: (options?: RequestInit) => Promise<T | null>
  refresh: () => Promise<T | null>
}

export function useApi<T = any> (
  url: string | Ref<string> | (() => string),
  options: UseApiOptions<T> & RequestInit = {}
): UseApiReturn<T> {
  const {
    immediate = true,
    onSuccess,
    onError,
    transform,
    ...fetchOptions
  } = options;

  const data = ref<T | null>(null);
  const error = ref<ApiError | null>(null);
  const loading = ref(false);

  const getUrl = () => {
    if (typeof url === 'function') { return url(); }
    if (isRef(url)) { return url.value; }
    return url;
  };

  const execute = async (overrideOptions?: RequestInit): Promise<T | null> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<T>>(getUrl(), {
        ...fetchOptions,
        ...overrideOptions
      });

      if (!response.success) {
        throw response.error || new Error('API request failed');
      }

      const result = transform ? transform(response.data) : response.data as T;
      data.value = result;

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (e: any) {
      const apiError: ApiError = e.data?.error || {
        code: 'UNKNOWN_ERROR',
        message: e.message || 'An unexpected error occurred',
        statusCode: e.statusCode || 500
      };

      error.value = apiError;

      if (onError) {
        onError(apiError);
      }

      return null;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => execute();

  if (immediate) {
    execute();
  }

  return {
    data: readonly(data),
    error: readonly(error),
    loading: readonly(loading),
    execute,
    refresh
  };
}

// Specialized hook for POST/PUT/DELETE operations
export function useApiMutation<TRequest = any, TResponse = any> (
  url: string | Ref<string> | (() => string),
  options: Omit<UseApiOptions<TResponse>, 'immediate'> & RequestInit = {}
): {
  data: Ref<TResponse | null>
  error: Ref<ApiError | null>
  loading: Ref<boolean>
  mutate: (body?: TRequest, options?: RequestInit) => Promise<TResponse | null>
} {
  const api = useApi<TResponse>(url, {
    ...options,
    immediate: false
  });

  const mutate = async (body?: TRequest, overrideOptions?: RequestInit) => {
    return api.execute({
      ...overrideOptions,
      body: body ? JSON.stringify(body) : undefined
    });
  };

  return {
    data: api.data,
    error: api.error,
    loading: api.loading,
    mutate
  };
}

// Hook for paginated API calls
export interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export function useApiPaginated<T = any> (
  baseUrl: string,
  options: UseApiOptions<PaginatedData<T>> & { perPage?: number } = {}
) {
  const page = ref(1);
  const perPage = ref(options.perPage || 20);

  const url = computed(() => {
    const params = new URLSearchParams({
      page: page.value.toString(),
      per_page: perPage.value.toString()
    });
    return `${baseUrl}?${params.toString()}`;
  });

  const api = useApi<PaginatedData<T>>(url, options);

  const hasNextPage = computed(() => {
    if (!api.data.value) { return false; }
    return api.data.value.page < api.data.value.total_pages;
  });

  const hasPrevPage = computed(() => page.value > 1);

  const nextPage = () => {
    if (hasNextPage.value) {
      page.value++;
    }
  };

  const prevPage = () => {
    if (hasPrevPage.value) {
      page.value--;
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= (api.data.value?.total_pages || 1)) {
      page.value = pageNum;
    }
  };

  return {
    ...api,
    page: readonly(page),
    perPage: readonly(perPage),
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage
  };
}
