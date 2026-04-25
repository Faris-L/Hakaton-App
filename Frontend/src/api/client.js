import { getSessionUserKey } from "../lib/nexoraSession.js";

const BASE = import.meta.env.VITE_API_URL ?? "";

export function userHeader() {
  const k = getSessionUserKey();
  return k ? { "X-Nexora-User": k } : {};
}

export async function postAiAsk(body) {
  return postJson("/ai", body);
}

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

export async function postNoteAssist(text) {
  return postJson("/api/notes/assist", { text });
}
