const DEFAULT_HEADERS = {
  accept: "application/json",
  "user-agent": "Observatorio-IA-Educacion-Empresa/0.1 (academic research)",
};

export async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 45_000;
  const attempts = options.attempts ?? 3;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { ...DEFAULT_HEADERS, ...options.headers },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al consultar ${url}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}
