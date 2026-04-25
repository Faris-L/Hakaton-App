import { postJson, userHeader } from "./client.js";
import { getMockSetById, getMockSetList } from "../lib/flashcardsMock.js";

const BASE = import.meta.env.VITE_API_URL ?? "";

async function parseJsonRes(res) {
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

export async function fetchFlashcardSets(subject) {
  const q =
    subject && subject !== "all"
      ? `?subject=${encodeURIComponent(subject)}`
      : "";
  const path = `/flashcard-sets${q}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", ...userHeader() },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error("api");
    }
    if (Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn("[Flashcards] lista API:", e);
  }
  return getMockSetList(subject);
}

export async function fetchFlashcardSet(id) {
  const path = `/flashcard-sets/${id}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", ...userHeader() },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("[Flashcards] set API:", e);
  }
  return getMockSetById(id);
}

export async function createFlashcardSet(body) {
  const path = "/flashcard-sets";
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
  return parseJsonRes(res);
}

export async function updateFlashcardSet(id, body) {
  const path = `/flashcard-sets/${id}`;
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
  return parseJsonRes(res);
}

export async function deleteFlashcardSet(id) {
  const path = `/flashcard-sets/${id}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Accept: "application/json", ...userHeader() },
  });
  return parseJsonRes(res);
}

export async function addFlashcardsToSet(setId, cards) {
  const path = `/flashcard-sets/${setId}/cards`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...userHeader(),
    },
    body: JSON.stringify({ cards }),
  });
  return parseJsonRes(res);
}

export async function updateFlashcard(id, body) {
  const path = `/flashcards/${id}`;
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
  return parseJsonRes(res);
}

export async function deleteFlashcard(id) {
  const path = `/flashcards/${id}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Accept: "application/json", ...userHeader() },
  });
  return parseJsonRes(res);
}

export async function generateFlashcards(topic, count) {
  return postJson("/api/flashcard-sets/generate", { topic, count });
}
