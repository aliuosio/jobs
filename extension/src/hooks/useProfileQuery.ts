import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { apiService } from '../services/api';
import type { UserProfile } from '../types/index';

export function useProfileQuery() {
  return useQuery<UserProfile | null, Error>({
    queryKey: queryKeys.profile,
    queryFn: () => apiService.getProfile(),
  });
}