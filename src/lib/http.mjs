const DEFAULT_HEADERS = {
  accept: "application/json",
  "user-agent": "Observatorio-IA-Educacion-Empresa/0.1 (academic research)",
};

export async function fetchWithRetry(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 45_000;
  const attempts = options.attempts ?? 3;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let delayMs = Math.min(1000 * 2 ** (attempt - 1), 30_000);
    try {
      const response = await fetchImpl(url, {
        headers: { ...DEFAULT_HEADERS, ...options.headers },
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} al consultar ${url}`);
        error.status = response.status;
        error.retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
        const retryAfter = response.headers.get("retry-after");
        if (retryAfter) {
          const seconds = Number(retryAfter);
          const requested = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
          // Do not retry earlier than requested or hold a run indefinitely.
          if (requested > 60_000) error.retryable = false;
          else if (Number.isFinite(requested)) delayMs = Math.max(delayMs, requested);
        }
        await response.body?.cancel();
        throw error;
      }
      return { response, attempts: attempt };
    } catch (error) {
      error.attempts = attempt;
      lastError = error;
      if (error.retryable === false || attempt === attempts) throw error;
    } finally {
      clearTimeout(timeout);
    }
    await sleep(delayMs);
  }
  throw lastError;
}

export async function fetchJson(url, options = {}) {
  const resource = await fetchResource(url, options);
  return JSON.parse(new TextDecoder("utf-8").decode(resource.bytes));
}

export async function fetchText(url, options = {}) {
  const resource = await fetchResource(url, {
    ...options,
    headers: { accept: "text/csv", ...options.headers },
  });
  return new TextDecoder("utf-8").decode(resource.bytes);
}

export async function fetchBytes(url, options = {}) {
  const resource = await fetchResource(url, {
    ...options,
    headers: { accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ...options.headers },
  });
  return resource.bytes;
}

export async function fetchResource(url, options = {}) {
  const { response, attempts } = await fetchWithRetry(url, options);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return {
    bytes,
    url: response.url || String(url),
    status: response.status,
    attempts,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    contentType: response.headers.get("content-type"),
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
  };
}
