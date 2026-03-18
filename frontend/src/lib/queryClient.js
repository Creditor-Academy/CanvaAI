import { QueryClient } from '@tanstack/react-query';

// Production-grade query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ⏰ Stale time: Data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // 🗄️ Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // 🔄 Retry strategy: Only retry once on failure
      retry: 1,
      
      // ⚠️ Refetch on window focus: Disabled (we'll manually invalidate when needed)
      refetchOnWindowFocus: false,
      
      // 🔄 Refetch on mount: Disabled (we use manual triggers)
      refetchOnMount: false,
      
      // 🔄 Refetch on reconnect: Enabled (good UX)
      refetchOnReconnect: true,
    },
  },
});
