/**
 * Web Speech Synthesis (glas čita klijentovu poruku u pregledaču).
 * Jezik: prvo srpski, zatim hrvatski/bosanski (bolji glasovi na Windows/Chrome) pre engleskog.
 */

export function isSpeechSynthesisAvailable() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

/**
 * Viši skor = bolji kandidat za naš srpski/latinični tekst.
 * Engleski glas sačuvamo samo ako nema smislenog alternativnog.
 */
function scoreVoiceForLocale(v) {
  const name = (v.name || "").toLowerCase();
  const lang = (v.lang || "").toLowerCase();
  let s = 0;

  if (lang.startsWith("sr")) s += 120;
  if (lang.startsWith("hr")) s += 88;
  if (lang.startsWith("bs")) s += 86;
  if (lang.startsWith("me-") || name.includes("montenegro")) s += 82;
  if (lang.startsWith("sl") && (name.includes("slov") || /sl[-_]si/.test(lang))) s += 30;

  if (/neural|natural|apremium|wavenet|enhanced|online/i.test(name)) s += 40;
  if (name.includes("google") && (lang.startsWith("sr") || lang.startsWith("hr") || lang.startsWith("bs") || /срп|hrv|bos/i.test(name)))
    s += 35;
  if (name.includes("microsoft") && (lang.startsWith("sr") || lang.startsWith("hr") || lang.startsWith("bs") || /matej|zora|goran|davor/i.test(name)))
    s += 32;

  if (/(срп|srb|serbian|serb|srpski)/i.test(name) && !lang.startsWith("en")) s += 25;
  if (/(croat|hrvatski|matej|zora|bosn|bosanski)/i.test(name)) s += 22;

  if (lang.startsWith("en")) s -= 70;
  if (lang.startsWith("de") || lang.startsWith("fr")) s -= 30;

  if (v.default && s > -20) s += 3;
  if (v.localService === true) s += 5;

  return s;
}

/**
 * Jezik koji se šalje uz utterance — usklađen sa glasom da čitanje bude u doslednom jeziku.
 */
function langForVoice(v) {
  if (!v) return "sr-RS";
  const l = (v.lang || "sr-RS").trim();
  if (/^sr/i.test(l) || /^hr/i.test(l) || /^bs/i.test(l) || /^me/i.test(l)) return l;
  if (/^b-in/i.test(l)) return l;
  return l || "sr-RS";
}

/**
 * Dva najbolja pokušaja: sortirani svi, pa uzmimo prvi; ako nema, null.
 */
export function getBestTtsVoice() {
  if (!isSpeechSynthesisAvailable()) return null;
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return null;

  const sorted = all
    .filter((v) => v && (v.name || v.lang))
    .sort((a, b) => scoreVoiceForLocale(b) - scoreVoiceForLocale(a));

  const first = sorted[0];
  if (first) {
    const s = scoreVoiceForLocale(first);
    if (s > 5) return first;
  }

  const anySlavic = sorted.find(
    (v) =>
      scoreVoiceForLocale(v) > 0 ||
      /^(sr|hr|bs|me|sl)/.test((v.lang || "").toLowerCase())
  );
  if (anySlavic) return anySlavic;

  const notEnglish = sorted.filter((v) => {
    const l = (v.lang || "").toLowerCase();
    return l && !l.startsWith("en");
  });
  if (notEnglish.length) {
    return notEnglish[0];
  }

  return first || all[0] || null;
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
  const { onStart, onEnd, rate: rateOpt } = opts;
  if (!isSpeechSynthesisAvailable() || !String(text).trim()) {
    onEnd?.();
    return () => {};
  }

  stopSimulationTts();

  const u = new SpeechSynthesisUtterance(text.trim());
  const voice = getBestTtsVoice();
  if (voice) {
    u.voice = voice;
    u.lang = langForVoice(voice);
  } else {
    u.lang = "sr-RS";
  }

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
