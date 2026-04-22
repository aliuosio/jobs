import { useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { FillResult } from '../types/index';

interface FillRequest {
  url: string;
  fields: string[];
}

export function useFillFields() {
  return useMutation<FillResult, Error, FillRequest>({
    mutationKey: ['fillFields'],
    mutationFn: async ({ url, fields }) => {
      const response = await apiService.searchFields({
        query: url,
        generate: true,
        top_k: fields.length,
      });
      return {
        success: true,
        filledCount: response.results.filter((f) => f.filled).length,
        errors: [],
      };
    },
  });
}