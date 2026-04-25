import { postJson } from "./client.js";
import {
  getMockLectureById,
  getMockLectures,
} from "../lib/lecturesMock.js";

const BASE = import.meta.env.VITE_API_URL ?? "";

export function getLecturePlayUrl(lecture) {
  if (!lecture) return null;
  if (lecture.type === "audio") {
    return lecture.file_url || null;
  }
  return lecture.video_url || null;
}

export async function fetchLecturesList(subject) {
  const q =
    subject && subject !== "all"
      ? `?subject=${encodeURIComponent(subject)}`
      : "";
  const path = `/lectures${q}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(String(res.status));
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn("[Lectures] API lista nedostupna, koristim lokalne primere.", e);
  }

  return getMockLectures(subject);
}

export async function fetchLectureById(id) {
  const path = `/lectures/${id}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("[Lectures] API detalj nedostupan, pokušavam mock.", e);
  }

  return getMockLectureById(id);
}

export async function postLectureSummarize(lectureId) {
  return postJson("/api/lectures/summarize", { lecture_id: lectureId });
}

export async function createLecture(body) {
  return postJson("/lectures", body);
}

export async function updateLecture(id, body) {
  const path = `/lectures/${id}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseRes(res);
}

export async function deleteLecture(id) {
  const path = `/lectures/${id}`;
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  return parseRes(res);
}

async function parseRes(res) {
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
