'use client';

/**
 * NEXORA Client Providers
 * Sets up TanStack Query and configures the API client with the auth store token.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { configureApiClient } from '@/lib/api/client';

configureApiClient(() => useAuthStore.getState().token);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401/403
        if (error instanceof Error) {
          const msg = error.message;
          if (msg.includes('401') || msg.includes('403')) return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
