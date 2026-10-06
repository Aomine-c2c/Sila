'use client';

/**
 * NEIMAN Client Providers
 * Sets up TanStack Query and configures the API client with the auth store token.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { configureApiClient } from '@/lib/api/client';

configureApiClient(() => useAuthStore.getState().token);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute stale time avoids aggressive refetching
      gcTime: 10 * 60_000, // Retain inactive queries in garbage collector for 10 minutes
      refetchOnWindowFocus: false, // Prevent redundant background network requests on tab focus
      refetchOnReconnect: 'always',
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

import { ThemeProvider } from '@/components/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
