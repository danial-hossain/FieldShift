// frontend/src/apiClient.js
// Centralized, resilient HTTP API client with SWR in-memory caching and request deduplication

export function formatApiBase(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (!/^https?:\/\//i.test(cleaned) && cleaned.includes('.')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

export const API_BASE = formatApiBase(import.meta.env?.VITE_API_URL || '');

// Global SWR Cache: Map<string, { data: any, timestamp: number, promise?: Promise<any> }>
const _swrCache = new Map();
export const SWR_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function clearClientCache() {
  _swrCache.clear();
}

export function getCachedResponse(cacheKey) {
  const entry = _swrCache.get(cacheKey);
  if (!entry) return null;
  return entry.data;
}

function buildCacheKey(path, options, bodyToSend) {
  const method = (options.method || 'GET').toUpperCase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (method === 'GET') {
    return `GET::${normalizedPath}`;
  }
  // Cache idempotent read-like POST endpoints
  if (method === 'POST' && (
    normalizedPath.includes('/api/planning') ||
    normalizedPath.includes('/api/workflow') ||
    normalizedPath.includes('/api/counterfactual')
  )) {
    return `POST::${normalizedPath}::${typeof bodyToSend === 'string' ? bodyToSend : ''}`;
  }
  return null;
}

export async function request(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
  const isPlainObject = options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams) && !(options.body instanceof Blob);
  const bodyToSend = isPlainObject ? JSON.stringify(options.body) : options.body;

  const bypassCache = options.cache === false || options.method === 'DELETE' || options.method === 'PUT';
  const cacheKey = !bypassCache ? buildCacheKey(path, options, bodyToSend) : null;

  if (cacheKey && _swrCache.has(cacheKey)) {
    const entry = _swrCache.get(cacheKey);
    const age = Date.now() - entry.timestamp;

    // In-flight deduplication: return same active promise
    if (entry.promise) {
      return entry.promise;
    }

    // Fresh cache hit (< 10 min): return immediately
    if (age < SWR_TTL_MS && entry.data !== undefined) {
      return entry.data;
    }

    // Stale: trigger background revalidation and return stale data immediately
    if (entry.data !== undefined) {
      executeFetch(url, options, bodyToSend, cacheKey).catch(() => {});
      return entry.data;
    }
  }

  // Active fetch execution
  return executeFetch(url, options, bodyToSend, cacheKey);
}

async function executeFetch(url, options, bodyToSend, cacheKey) {
  const fetchPromise = (async () => {
    let response;
    try {
      response = await fetch(url, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options,
        body: bodyToSend
      });
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      throw new Error(`Could not reach the FastAPI backend at ${API_BASE || 'localhost:8000'} (${err.message}). Verify backend service is active.`);
    }

    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error(`Backend returned a non-JSON response (HTTP ${response.status}). Verify FastAPI endpoint.`);
    }

    if (!response.ok) {
      const detail = Array.isArray(body?.detail)
        ? body.detail.map(item => item.msg || item.loc?.join('.') || 'Invalid request').join('; ')
        : body?.detail;
      throw new Error(detail || body?.message || `Request failed (${response.status})`);
    }

    if (cacheKey) {
      _swrCache.set(cacheKey, {
        data: body,
        timestamp: Date.now(),
        promise: null,
      });
    }

    return body;
  })();

  if (cacheKey) {
    const existing = _swrCache.get(cacheKey);
    _swrCache.set(cacheKey, {
      data: existing?.data,
      timestamp: existing?.timestamp || 0,
      promise: fetchPromise,
    });
  }

  try {
    return await fetchPromise;
  } finally {
    if (cacheKey) {
      const curr = _swrCache.get(cacheKey);
      if (curr && curr.promise === fetchPromise) {
        curr.promise = null;
      }
    }
  }
}

export function prefetch(path, options = {}) {
  try {
    request(path, { ...options }).catch(() => {});
  } catch {}
}

export default request;
