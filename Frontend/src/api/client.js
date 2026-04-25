const BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * @param {string} path
 * @param {Record<string, unknown>} [body]
 */
export async function postJson(path, body) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      data.error || data.message || `HTTP ${res.status}: ${res.statusText}`
    );
    err.data = data;
    throw err;
  }
  return data;
}
