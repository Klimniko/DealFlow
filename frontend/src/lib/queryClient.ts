import { QueryCache, QueryClient } from '@tanstack/react-query';
import { logout } from '../api/auth';

type ApiError = {
  status: number;
  message: string;
  code?: string;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const err = error as ApiError;
        if (err.status === 401 || err.status === 403) {
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
      const err = error as ApiError;
      if (err.status === 401) {
        await logout();
        window.location.href = '/login';
      }
    },
  }),
});
