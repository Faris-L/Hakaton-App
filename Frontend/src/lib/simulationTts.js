/**
 * TTS klijenta: ElevenLabs preko backenda (POST /api/tts, eleven_multilingual_v2 u .env).
 * Pri grešci samo console.error; chat ostaje ispravan.
 */

import { postTtsAudio } from "../api/client.js";

const TTS_PATH = "/api/tts";

let activeCancel = null;
let mediaUnlockAudioCtx = null;

/**
 * Mora se pozvati sinhronu u istom handleru klika koji pokreće TTS, PRE prvog `await`
 * (mreža troši user-activation, pa inače `new Audio().play()` može tiho otkazati).
 */
export function unlockAudioPlaybackFromUserGesture() {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    try {
      if (!mediaUnlockAudioCtx) {
        mediaUnlockAudioCtx = new AC();
      }
      if (mediaUnlockAudioCtx.state === "suspended") {
        void mediaUnlockAudioCtx.resume();
      }
      const o = mediaUnlockAudioCtx.createOscillator();
      const g = mediaUnlockAudioCtx.createGain();
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(mediaUnlockAudioCtx.destination);
      o.start(0);
      o.stop(0.001);
    } catch {
      /* ignore */
    }
  }
  try {
    const a = new Audio();
    a.volume = 0.001;
    a.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBIAAAABAAEABwA7";
    void a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

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
      audioEl.setAttribute("playsinline", "true");
      audioEl.setAttribute("webkit-playsinline", "true");
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
