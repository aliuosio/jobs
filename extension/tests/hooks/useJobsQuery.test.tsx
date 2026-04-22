import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useJobsQuery } from '../../src/hooks/useJobsQuery';
import type { ReactNode } from 'react';

vi.stubGlobal('chrome', {
  storage: { local: { get: vi.fn(), set: vi.fn() } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useJobsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isLoading initially', async () => {
    const { result } = renderHook(() => useJobsQuery(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});