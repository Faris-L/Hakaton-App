import { getSessionUserKey } from "../lib/nexoraSession.js";

const BASE = import.meta.env.VITE_API_URL ?? "";

export function userHeader() {
  const k = getSessionUserKey();
  return k ? { "X-Nexora-User": k } : {};
}

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

/**
 * TTS: vraća audio/mpeg blob (ElevenLabs preko backenda).
 * @param {string} path npr. /api/tts
 * @param {{ text: string }} body
 * @returns {Promise<Blob>}
 */
export async function postTtsAudio(path, body) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg, audio/*, application/octet-stream, */*",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(
      data.error || data.message || `HTTP ${res.status}: ${res.statusText}`
    );
    err.data = data;
    throw err;
  }
  const ct = (res.headers.get("Content-Type") || "").toLowerCase();
  if (
    !ct.includes("audio") &&
    !ct.includes("octet-stream") &&
    !ct.includes("binary")
  ) {
    const t = await res.text();
    const err = new Error("TTS: neočekivan odgovor (nije audio)");
    err.data = t;
    throw err;
  }
  return res.blob();
}

// --- Beleške (Laravel: user_key preko zaglavlja) ---

/**
 * @param {string} [subject] medicine|psychology|economy|it — izostavi za sve
 */
export async function fetchNotesList(subject) {
  const q =
    subject && subject !== "all"
      ? `?subject=${encodeURIComponent(subject)}`
      : "";
  const path = `/notes${q}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...userHeader(),
    },
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

/**
 * @param {{ title: string, content: string, subject: string }} body
 */
export async function createNote(body) {
  const path = "/notes";
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...userHeader(),
    },
    body: JSON.stringify(body),
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

/**
 * @param {number} id
 * @param {{ title: string, content: string, subject: string }} body
 */
export async function updateNote(id, body) {
  const path = `/notes/${id}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...userHeader(),
    },
    body: JSON.stringify(body),
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

/**
 * @param {number} id
 */
export async function deleteNote(id) {
  const path = `/notes/${id}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...userHeader(),
    },
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

/**
 * AI pomoć za tekst beleške (samo sređivanje proširivanje, bez drugih formata).
 * @param {string} text
 */
export async function postNoteAssist(text) {
  return postJson("/api/notes/assist", { text });
}
