/**
 * Web Speech Synthesis (glas čita klijentovu poruku u pregledaču).
 * Podrška: Chrome, Edge, Safari; Firefox ograničen.
 */

export function isSpeechSynthesisAvailable() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

export function getBestTtsVoice() {
  if (!isSpeechSynthesisAvailable()) return null;
  const v = window.speechSynthesis.getVoices();
  if (!v.length) return null;
  const byPrefix = (prefix) =>
    v.find((x) => x.lang && x.lang.toLowerCase().startsWith(prefix));
  return (
    byPrefix("sr") ||
    byPrefix("hr") ||
    byPrefix("bs") ||
    v.find(
      (x) =>
        x.lang && /(sr|hr|bs|me|balkan)/i.test(x.name + x.lang)
    ) ||
    v.find((x) => x.default) ||
    v[0]
  );
}

/**
 * Zaustavi sve čitanje.
 */
export function stopSimulationTts() {
  if (!isSpeechSynthesisAvailable()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/**
 * Pročitaj tekst; vraća funkciju za otkazivanje.
 * @param {string} text
 * @param {{ onStart?: () => void, onEnd?: () => void, rate?: number }} [opts]
 * @returns {() => void}
 */
export function speakClientMessage(text, opts = {}) {
  const { onStart, onEnd, rate = 0.95 } = opts;
  if (!isSpeechSynthesisAvailable() || !String(text).trim()) {
    onEnd?.();
    return () => {};
  }

  stopSimulationTts();

  const u = new SpeechSynthesisUtterance(text.trim());
  u.lang = "sr-RS";
  const voice = getBestTtsVoice();
  if (voice) {
    u.voice = voice;
  }
  u.rate = rate;
  u.pitch = 1;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();

  window.speechSynthesis.speak(u);

  return () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  };
}

/**
 * Podesi osluškić kako bi getVoices() napunio listu (Chrome delay).
 * @param {() => void} onReady
 * @returns {() => void} cleanup
 */
export function onTtsVoicesReady(onReady) {
  if (!isSpeechSynthesisAvailable()) {
    onReady();
    return () => {};
  }
  const s = window.speechSynthesis;
  const run = () => onReady();
  s.addEventListener("voiceschanged", run);
  run();
  if (s.getVoices().length) {
    onReady();
  }
  return () => s.removeEventListener("voiceschanged", run);
}
