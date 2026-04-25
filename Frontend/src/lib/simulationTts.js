/**
 * Web Speech Synthesis (glas klijenta u pregledaču).
 * Dozvoljeni su samo glasovi sa jezikom sr / hr / bs (BCP-47). Nema fallbacka na druge jezike.
 */

export function isSpeechSynthesisAvailable() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

const UTTERANCE_LANG = "sr-RS";

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeLangTag(raw) {
  if (!raw) return "";
  return String(raw).toLowerCase().replace(/_/g, "-");
}

/**
 * Dozvoljeno: sr, sr-*, hr, hr-*, bs, bs-*
 * (npr. sr-RS, hr-HR, bs-BA)
 * @param {SpeechSynthesisVoice} v
 * @returns {boolean}
 */
export function isAllowedBalkanTtsVoice(v) {
  if (!v) return false;
  const t = normalizeLangTag(v.lang || "");
  if (!t) return false;
  if (t === "sr" || t.startsWith("sr-")) return true;
  if (t === "hr" || t.startsWith("hr-")) return true;
  if (t === "bs" || t.startsWith("bs-")) return true;
  return false;
}

/**
 * @param {SpeechSynthesisVoice} v
 * @returns {number}
 */
function rankAllowedVoice(v) {
  if (!isAllowedBalkanTtsVoice(v)) return -1;
  const t = normalizeLangTag(v.lang || "");
  let s = 0;
  if (t === "sr" || t.startsWith("sr-")) s += 300;
  else if (t === "hr" || t.startsWith("hr-")) s += 200;
  else if (t === "bs" || t.startsWith("bs-")) s += 100;
  const name = (v.name || "").toLowerCase();
  if (/neural|natural|wavenet|enhanced|online/i.test(name)) s += 40;
  if (name.includes("google") || name.includes("microsoft")) s += 15;
  if (v.localService === true) s += 5;
  return s;
}

/**
 * Prvi dozvoljeni glas po rangu, ili null.
 */
export function getBestTtsVoice() {
  if (!isSpeechSynthesisAvailable()) return null;
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return null;

  const allowed = all
    .filter((v) => v && (v.name || v.lang) && isAllowedBalkanTtsVoice(v))
    .sort((a, b) => rankAllowedVoice(b) - rankAllowedVoice(a));

  return allowed[0] || null;
}

/**
 * Ima li barem jedan podržan balkanski (sr/hr/bs) glas.
 */
export function hasSupportedBalkanTtsVoice() {
  return getBestTtsVoice() != null;
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
 * Pročitaj tekst. Bez podržanog glasa (sr/hr/bs) ne priča — poziva onEnd odmah.
 * @param {string} text
 * @param {{ onStart?: () => void, onEnd?: () => void, rate?: number }} [opts]
 * @returns {() => void}
 */
export function speakClientMessage(text, opts = {}) {
  const { onStart, onEnd, rate: rateOpt } = opts;
  if (!isSpeechSynthesisAvailable() || !String(text).trim()) {
    onEnd?.();
    return () => {};
  }

  const voice = getBestTtsVoice();
  if (!voice) {
    onEnd?.();
    return () => {};
  }

  stopSimulationTts();

  const u = new SpeechSynthesisUtterance(text.trim());
  u.voice = voice;
  u.lang = UTTERANCE_LANG;

  const baseRate = 0.88;
  u.rate = typeof rateOpt === "number" ? rateOpt : baseRate;
  u.pitch = 1;
  u.volume = 1;
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
