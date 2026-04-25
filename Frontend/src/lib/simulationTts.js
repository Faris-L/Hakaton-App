/**
 * TTS klijenta: ElevenLabs preko backenda (POST /api/tts, eleven_multilingual_v2 u .env).
 * Pri grešci samo console.error; chat ostaje ispravan.
 */

import { postTtsAudio } from "../api/client.js";

const TTS_PATH = "/api/tts";

let activeCancel = null;

export function stopSimulationTts() {
  if (typeof activeCancel === "function") {
    try {
      activeCancel();
    } catch {
      /* ignore */
    }
    activeCancel = null;
  }
}

/**
 * @param {string} text
 * @param {{ onStart?: () => void, onEnd?: () => void }} [opts]
 * @returns {() => void} otkazivanje (npr. pre novog čitanja)
 */
export function speakClientMessage(text, opts = {}) {
  const { onStart, onEnd } = opts;
  stopSimulationTts();

  let cancelled = false;
  let audioEl = null;
  let objectUrl = null;
  let done = false;

  const fireEnd = () => {
    if (done) return;
    done = true;
    onEnd?.();
  };

  const cleanupAudio = () => {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* ignore */
      }
      objectUrl = null;
    }
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.removeAttribute("src");
        audioEl.load();
      } catch {
        /* ignore */
      }
      audioEl = null;
    }
  };

  const cancel = () => {
    if (done) return;
    cancelled = true;
    cleanupAudio();
    fireEnd();
    if (activeCancel === cancel) {
      activeCancel = null;
    }
  };

  activeCancel = cancel;

  (async () => {
    const trimmed = String(text).trim();
    if (!trimmed) {
      fireEnd();
      if (activeCancel === cancel) {
        activeCancel = null;
      }
      return;
    }
    try {
      const blob = await postTtsAudio(TTS_PATH, { text: trimmed });
      if (cancelled) {
        fireEnd();
        if (activeCancel === cancel) {
          activeCancel = null;
        }
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      audioEl = new Audio();
      audioEl.preload = "auto";
      audioEl.src = objectUrl;

      audioEl.onended = () => {
        cleanupAudio();
        if (!done) {
          done = true;
          onEnd?.();
        }
        if (activeCancel === cancel) {
          activeCancel = null;
        }
      };
      audioEl.onerror = () => {
        console.error("[TTS] Greška pri reprodukciji audio zapisa");
        cleanupAudio();
        if (!done) {
          done = true;
          onEnd?.();
        }
        if (activeCancel === cancel) {
          activeCancel = null;
        }
      };

      onStart?.();
      try {
        await audioEl.play();
      } catch (playErr) {
        console.error("[TTS] Pregledač je odbio reprodukciju (npr. autoplay):", playErr);
        cleanupAudio();
        if (!done) {
          done = true;
          onEnd?.();
        }
        if (activeCancel === cancel) {
          activeCancel = null;
        }
      }
    } catch (e) {
      console.error("[TTS] ElevenLabs / mreža:", e);
      cleanupAudio();
      if (!done) {
        done = true;
        onEnd?.();
      }
      if (activeCancel === cancel) {
        activeCancel = null;
      }
    }
  })();

  return () => {
    if (!done) {
      cancel();
    }
  };
}

/**
 * Nije potrebno čekati učitavanje pregledačkih glasova.
 * @param {() => void} onReady
 * @returns {() => void}
 */
export function onTtsVoicesReady(onReady) {
  onReady();
  return () => {};
}
