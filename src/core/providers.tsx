import React, { type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { DatabaseProvider } from '../core/database/provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 2000 },
  },
});

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ReduxProvider store={store}>
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider>
        {children}
      </DatabaseProvider>
    </QueryClientProvider>
  </ReduxProvider>
);
