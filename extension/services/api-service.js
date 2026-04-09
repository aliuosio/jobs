const API_ENDPOINT = 'http://localhost:8000';
const API_TIMEOUT_MS = 10000;

async function fetchJobOffers(limit, offset) {
  const url = new URL(`${API_ENDPOINT}/job-offers`);
  if (typeof limit !== 'undefined') url.searchParams.append('limit', String(limit));
  if (typeof offset !== 'undefined') url.searchParams.append('offset', String(offset));

  const response = await fetch(url.toString(), {
    method: 'GET',
    signal: AbortSignal.timeout(API_TIMEOUT_MS)
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
    signal: AbortSignal.timeout(API_TIMEOUT_MS)
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
    signal: AbortSignal.timeout(API_TIMEOUT_MS)
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
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

const apiService = {
  API_ENDPOINT,
  fetchJobOffers,
  fillForm,
  updateJobOfferProcess,
  fetchCSV,
  checkHealth
};

if (typeof window !== 'undefined') {
  window.apiService = apiService;
}