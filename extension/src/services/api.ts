import type { JobLink, FormField, UserProfile } from '../types/index';

const BASE_URL = 'http://localhost:8000';

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

interface ProcessJobResponse {
  research: string;
  research_email: string;
  applied: boolean;
}

interface HealthResponse {
  status: string;
}

interface ApiError {
  error: string;
  message?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const apiService = {
  async getJobOffers(): Promise<JobLink[]> {
    const response = await fetch(`${BASE_URL}/job-offers`);
    return handleResponse<JobLink[]>(response);
  },

  async processJobOffer(id: string): Promise<ProcessJobResponse> {
    const response = await fetch(`${BASE_URL}/job-offers/${id}/process`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<ProcessJobResponse>(response);
  },

  async searchFields(request: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(`${BASE_URL}/api/v1/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return handleResponse<SearchResponse>(response);
  },

  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${BASE_URL}/health`);
    return handleResponse<HealthResponse>(response);
  },

  async getProfile(): Promise<UserProfile | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get('userProfile', (result) => {
        resolve((result.userProfile as UserProfile) || null);
      });
    });
  },
};