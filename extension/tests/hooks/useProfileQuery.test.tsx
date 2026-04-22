import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfileQuery } from '../../src/hooks/useProfileQuery';
import type { ReactNode } from 'react';

vi.stubGlobal('chrome', {
  storage: { local: { get: vi.fn(), set: vi.fn() } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useProfileQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isLoading initially', async () => {
    const { result } = renderHook(() => useProfileQuery(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});
