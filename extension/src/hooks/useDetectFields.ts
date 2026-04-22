import { useMutation } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { apiService } from '../services/api';
import type { FormField } from '../types/index';

interface SearchRequest {
  query: string;
  signals?: string[];
  use_hyde?: boolean;
  use_reranking?: boolean;
  top_k?: number;
  include_scores?: boolean;
  generate?: boolean;
}

interface SearchResponse {
  results: FormField[];
  query: string;
  total_retrieved: number;
  generated_answer?: string;
  confidence?: number;
  field_type?: string;
}

export function useDetectFields() {
  return useMutation<SearchResponse, Error, SearchRequest>({
    mutationKey: queryKeys.fields(''),
    mutationFn: (request) => apiService.searchFields(request),
  });
}