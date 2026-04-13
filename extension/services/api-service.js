import { API_ENDPOINT, API_TIMEOUT_MS, N8N_WEBHOOK_URL } from './constants.js';
import { timeoutSignal } from './timeout-signal.js';

async function fetchJobOffers(limit, offset) {
  const url = new URL(`${API_ENDPOINT}/job-offers`);
  if (typeof limit !== 'undefined') url.searchParams.append('limit', String(limit));
  if (typeof offset !== 'undefined') url.searchParams.append('offset', String(offset));

  const response = await fetch(url.toString(), {
    method: 'GET',
    signal: timeoutSignal(API_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const json = await response.json();
  return json.job_offers ?? json.offers ?? [];
}

async function fillForm(label, signals) {
  const response = await fetch(`${API_ENDPOINT}/api/v1/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query: label, 
      signals,
      generate: true 
    }),
    signal: timeoutSignal(API_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const json = await response.json();
  return {
    answer: json.generated_answer,
    has_data: json.chunks.length > 0,
    confidence: json.confidence,
    context_chunks: json.chunks.length,
    field_value: json.generated_answer,
    field_type: json.field_type
  };
}

async function updateJobOfferProcess(jobOfferId, applied) {
  const response = await fetch(`${API_ENDPOINT}/job-offers/${jobOfferId}/process`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applied }),
    signal: timeoutSignal(API_TIMEOUT_MS)
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 404) throw new Error('NOT_FOUND');
    throw new Error(`API returned ${status}`);
  }

  return response.json();
}

async function fetchCSV() {
  const response = await fetch(`${API_ENDPOINT}/job-offers?format=csv`);
  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }
  return response.blob();
}

async function checkHealth() {
  try {
    const response = await fetch(`${API_ENDPOINT}/health`, {
      method: 'GET',
      signal: timeoutSignal(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function saveJobDescription(jobId, description) {
  const response = await fetch(`${API_ENDPOINT}/job-offers/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
    signal: timeoutSignal(API_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Save failed: ${response.status}`);
  return response.json();
}

async function triggerCoverLetterGeneration(jobId) {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_offers_id: jobId }),
    signal: timeoutSignal(API_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
  return response.json();
}

async function checkGenerationStatus(jobId) {
  const response = await fetch(`${API_ENDPOINT}/job-applications?job_offer_id=${jobId}`, {
    method: 'GET',
    signal: timeoutSignal(API_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Status check failed: ${response.status}`);
  const data = await response.json();
  const app = data.job_applications?.[0];
  if (!app) return { status: 'none' };
  if (app.content) return { status: 'completed' };
  return { status: 'processing' };
}

async function checkLetterStatus(jobId) {
  const response = await fetch(`${API_ENDPOINT}/job-offers/${jobId}/letter-status`, {
    method: 'GET',
    signal: timeoutSignal(API_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Letter status check failed: ${response.status}`);
  const data = await response.json();
  return data.letter_generated === true;
}

const apiService = {
  API_ENDPOINT,
  fetchJobOffers,
  fillForm,
  updateJobOfferProcess,
  fetchCSV,
  checkHealth,
  saveJobDescription,
  triggerCoverLetterGeneration,
  checkGenerationStatus,
  checkLetterStatus
};

if (typeof window !== 'undefined') {
  window.apiService = apiService;
}