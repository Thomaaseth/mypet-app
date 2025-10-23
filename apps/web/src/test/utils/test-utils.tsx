import React from 'react';
import { ReactNode, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook as rtlRenderHook, waitFor, RenderHookOptions } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createQueryWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderHookWithQuery<TResult, TProps = undefined>(
  hook: (props: TProps) => TResult,
  options?: { initialProps?: TProps; queryClient?: QueryClient }
) {
  const queryClient = options?.queryClient || createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const renderHookOptions: RenderHookOptions<TProps> = {
    wrapper: wrapper as any,
    ...(options?.initialProps !== undefined && { initialProps: options.initialProps }),
  };

  return {
    ...rtlRenderHook(hook, renderHookOptions),
    queryClient,
  };
}

export async function waitForQuery<T>(
  result: { current: T },
  predicate: (value: T) => boolean,
  options?: { timeout?: number }
) {
  await waitFor(() => {
    if (!predicate(result.current)) throw new Error('Predicate not satisfied');
  }, options);
}

export async function waitForMutation<T extends { isPending: boolean }>(
  result: { current: T },
  options?: { timeout?: number }
) {
  await waitFor(() => {
    if (result.current.isPending) throw new Error('Mutation still pending');
  }, options);
}