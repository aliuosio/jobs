const SSE_ENDPOINT = 'http://localhost:8000/api/v1/stream';

const MAX_RECONNECT_ATTEMPTS = 0;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY = 30000;

class SSEService {
  constructor() {
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.connectionStatus = 'disconnected';
    this.listeners = new Map();
    this.jobOffers = [];
  }

  getStatus() {
    return this.connectionStatus;
  }

  async updateStatus(status) {
    this.connectionStatus = status;
    this.notifyListeners('status', { status, timestamp: Date.now() });
  }

  calculateBackoffDelay() {
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY
    );
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }

  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.updateStatus('reconnecting');
    console.log('[SSE] Connecting to:', SSE_ENDPOINT);

    try {
      this.eventSource = new EventSource(SSE_ENDPOINT);

      this.eventSource.onopen = () => {
        console.log('[SSE] Connected');
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const offers = JSON.parse(event.data);
          if (Array.isArray(offers)) {
            this.jobOffers = offers;
            this.notifyListeners('update', { jobOffers: offers, timestamp: Date.now() });
          }
        } catch (err) {
          console.error('[SSE] Parse error:', err);
        }
      };

      this.eventSource.onerror = (err) => {
        console.error('[SSE] Error:', err);
        this.updateStatus('disconnected');
        if (this.eventSource?.readyState !== EventSource.CLOSED) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[SSE] Failed to create EventSource:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (MAX_RECONNECT_ATTEMPTS > 0 && this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[SSE] Max attempts reached');
      this.updateStatus('disconnected');
      return;
    }

    const delay = this.calculateBackoffDelay();
    this.reconnectAttempts++;
    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.updateStatus('disconnected');
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  getJobOffers() {
    return this.jobOffers;
  }
}

const sseService = new SSEService();

if (typeof window !== 'undefined') {
  window.sseService = sseService;
}