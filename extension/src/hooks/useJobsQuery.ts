import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { apiService } from '../services/api';
import type { JobLink } from '../types/index';

export function useJobsQuery() {
  return useQuery<JobLink[], Error>({
    queryKey: queryKeys.jobs,
    queryFn: () => apiService.getJobOffers(),
  });
}