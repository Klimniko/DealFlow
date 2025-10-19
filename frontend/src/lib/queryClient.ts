import { QueryCache, QueryClient } from '@tanstack/react-query';
import { logout } from '../api/auth';

type ApiError = {
  status: number;
  message: string;
  code?: string;
};

const isApiError = (error: unknown): error is ApiError => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return 'status' in error && typeof (error as { status: unknown }).status === 'number';
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (!isApiError(error)) {
          return failureCount < 2;
        }

        if (error.status === 401 || error.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: async (error) => {
      if (!isApiError(error)) {
        return;
      }

      if (error.status === 401) {
        await logout();
        window.location.href = '/login';
      }
    },
  }),
});
