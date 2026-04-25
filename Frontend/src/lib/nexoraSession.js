/**
 * Nalozi: korisničko ime (globalno) povezano sa jednim smerom.
 * Isti pregledač može imati više različitih naloga; svako ime samo na jedan smer.
 * Statistike su po nalogu.
 */

const K = {
  fieldCommitted: "nexoraFieldCommitted",
  /** @deprecated migrirano u registry */
  account: "nexoraAccount",
  session: "nexoraSession",
  /** @deprecated po korisniku u registry */
  stats: "nexoraStats",
  registry: "nexoraAccountsRegistry", // { [nameKey]: { name, passEnc, field, createdAt, stats } }
  currentUser: "nexoraCurrentUser", // nameKey
};

const FEATURES = ["simulation", "notes", "lectures", "flashcards"];

export const FIELD_NAMES = {
  medicine: "Medicina",
  economy: "Ekonomija",
  psychology: "Psihologija",
  it: "Informatika",
};

const VALID_FIELD_IDS = new Set(Object.keys(FIELD_NAMES));

const BODY_THEMES = [
  "theme-medicine",
  "theme-psychology",
  "theme-economy",
  "theme-it",
];

const FIELD_TO_THEME = {
  medicine: "theme-medicine",
  psychology: "theme-psychology",
  economy: "theme-economy",
  it: "theme-it",
};

function applyFieldThemeForBody(fieldId) {
  if (!fieldId) return;
  const theme = FIELD_TO_THEME[fieldId] || "theme-it";
  document.body.classList.remove(...BODY_THEMES);
  document.body.classList.add(theme);
}

function makeDefaultStats() {
  return Object.fromEntries(
    FEATURES.map((id) => [id, { scores: [], count: 0, sum: 0 }])
  );
}

function readJson(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    if (!s) return fallback;
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function userKey(nameRaw) {
  return (nameRaw || "").trim().toLowerCase();
}

function ensureRegistry() {
  let reg = readJson(K.registry, null);
  if (reg && typeof reg === "object" && !Array.isArray(reg)) {
    return reg;
  }

  const migrated = {};
  const legacy = readJson(K.account, null);
  if (legacy && legacy.name) {
    const key = userKey(legacy.name);
    const field = localStorage.getItem("selectedField") || "it";
    const oldStats = readJson(K.stats, makeDefaultStats());
    migrated[key] = {
      name: legacy.name,
      passEnc: legacy.passEnc,
      field: VALID_FIELD_IDS.has(field) ? field : "it",
      createdAt: legacy.createdAt || new Date().toISOString(),
      stats: normalizeStats(oldStats),
    };
    localStorage.removeItem(K.account);
    if (localStorage.getItem(K.stats) != null) {
      localStorage.removeItem(K.stats);
    }
  }
  localStorage.setItem(K.registry, JSON.stringify(migrated));
  return migrated;
}

function saveRegistry(reg) {
  localStorage.setItem(K.registry, JSON.stringify(reg));
}

function normalizeStats(s) {
  if (!s || typeof s !== "object") return makeDefaultStats();
  const o = { ...makeDefaultStats(), ...s };
  for (const id of FEATURES) {
    if (!o[id] || typeof o[id] !== "object") o[id] = { scores: [], count: 0, sum: 0 };
  }
  return o;
}

export function isFieldCommitted() {
  return localStorage.getItem(K.fieldCommitted) === "1";
}

export function setFieldCommitted() {
  localStorage.setItem(K.fieldCommitted, "1");
}

function getCurrentUserKey() {
  return localStorage.getItem(K.currentUser) || "";
}

function setCurrentUserKey(key) {
  if (key) localStorage.setItem(K.currentUser, key);
  else localStorage.removeItem(K.currentUser);
}

function setSessionActive(on) {
  if (on) localStorage.setItem(K.session, "1");
  else localStorage.removeItem(K.session);
}

export function isSessionActive() {
  if (localStorage.getItem(K.session) !== "1") return false;
  const k = getCurrentUserKey();
  if (!k) return false;
  const reg = ensureRegistry();
  return Boolean(reg[k]);
}

/** Ključ naloga (lowercase) za API beleški — uvek uz aktivan session */
export function getSessionUserKey() {
  if (localStorage.getItem(K.session) !== "1") return "";
  return getCurrentUserKey() || "";
}

function simpleEnc(pass) {
  return btoa(encodeURIComponent(pass));
}

function simpleDec(enc) {
  try {
    return decodeURIComponent(atob(enc));
  } catch {
    return null;
  }
}

/** Trenutno prijavljen nalog ili null */
export function getAccount() {
  if (localStorage.getItem(K.session) !== "1") return null;
  const k = getCurrentUserKey();
  if (!k) return null;
  const reg = ensureRegistry();
  return reg[k] || null;
}

/** Nakon učitavanja (npr. F5) uskladi smer i temu sa nalogom. */
export function syncProfileFieldFromCurrentAccount() {
  const a = getAccount();
  if (!a?.field) return;
  localStorage.setItem("selectedField", a.field);
  localStorage.setItem("hasSelectedOption", "true");
  localStorage.setItem(K.fieldCommitted, "1");
  applyFieldThemeForBody(a.field);
}

/**
 * Uloguj / registruj za smer u `localStorage.selectedField` (mora posle Intra).
 * Ako korisničko ime postoji na drugom smeru — greška sa nazivom smera.
 */
export function tryLoginOrRegister(nameRaw, passRaw) {
  const name = (nameRaw || "").trim();
  const pass = passRaw || "";
  if (name.length < 2) {
    return { ok: false, error: "Korisničko ime: najmanje 2 znaka." };
  }
  if (pass.length < 4) {
    return { ok: false, error: "Lozinka: najmanje 4 znaka." };
  }

  const field = localStorage.getItem("selectedField");
  if (!field || !VALID_FIELD_IDS.has(field)) {
    return { ok: false, error: "Nije izabran smer. Vrati se na uvod i odaberi smer." };
  }

  const key = userKey(name);
  const reg = ensureRegistry();
  const existing = reg[key];

  if (existing) {
    if (existing.field !== field) {
      const fLabel = FIELD_NAMES[existing.field] || existing.field;
      return {
        ok: false,
        error: `Korisničko ime već pripada nalogu na smeru „${fLabel}”. Otvori taj smer i prijavi se, ili upiši drugo ime na ovom smeru.`,
      };
    }
    if (simpleDec(existing.passEnc) !== pass) {
      return { ok: false, error: "Pogrešna lozinka." };
    }
    setCurrentUserKey(key);
    setSessionActive(true);
    syncProfileFieldFromCurrentAccount();
    return { ok: true, isNew: false };
  }

  const acc = {
    name,
    passEnc: simpleEnc(pass),
    field,
    createdAt: new Date().toISOString(),
    stats: makeDefaultStats(),
  };
  reg[key] = acc;
  saveRegistry(reg);
  setCurrentUserKey(key);
  setSessionActive(true);
  syncProfileFieldFromCurrentAccount();
  return { ok: true, isNew: true };
}

/** Smer (bez brisanja naloga) – da sa logina možeš opet na uvod. */
export function clearFieldSelectionForIntro() {
  localStorage.removeItem(K.fieldCommitted);
  localStorage.removeItem("selectedField");
  localStorage.removeItem("hasSelectedOption");
  document.body.classList.remove(
    "theme-medicine",
    "theme-psychology",
    "theme-economy",
    "theme-it"
  );
}

/** Odjavljivanje: briše intro-zaključavanje da možeš drugi smer / drugi nalog. Nalozi ostaju u memoriji. */
export function logoutSession() {
  setSessionActive(false);
  setCurrentUserKey("");
  clearFieldSelectionForIntro();
}

export function resetAllNexoraData() {
  setSessionActive(false);
  setCurrentUserKey("");
  localStorage.removeItem(K.registry);
  localStorage.removeItem(K.account);
  localStorage.removeItem(K.session);
  localStorage.removeItem(K.stats);
  localStorage.removeItem(K.fieldCommitted);
  localStorage.removeItem("selectedField");
  localStorage.removeItem("hasSelectedOption");
}

function getStats() {
  const k = getCurrentUserKey();
  if (!k) return makeDefaultStats();
  const reg = ensureRegistry();
  const a = reg[k];
  if (!a) return makeDefaultStats();
  a.stats = normalizeStats(a.stats);
  return a.stats;
}

function saveStats(s) {
  const k = getCurrentUserKey();
  if (!k) return;
  const reg = ensureRegistry();
  if (!reg[k]) return;
  reg[k].stats = normalizeStats(s);
  saveRegistry(reg);
}

export function recordAiScore(featureId, score0to10) {
  if (!FEATURES.includes(featureId)) return;
  const st = getStats();
  const b = st[featureId] || { scores: [], count: 0, sum: 0 };
  const n = Math.min(10, Math.max(0, Number(score0to10) || 0));
  b.scores.push(n);
  b.count = b.count + 1;
  b.sum = (b.sum || 0) + n;
  st[featureId] = b;
  saveStats(st);
}

export function recordFeatureTouch(featureId, optionalScore) {
  if (optionalScore != null) {
    recordAiScore(featureId, optionalScore);
    return;
  }
  if (!FEATURES.includes(featureId)) return;
  const st = getStats();
  const b = st[featureId] || { scores: [], count: 0, sum: 0 };
  const n = 7 + (Math.random() * 0.4 - 0.2);
  b.scores.push(n);
  b.count = b.count + 1;
  b.sum = (b.sum || 0) + n;
  st[featureId] = b;
  saveStats(st);
}

function avgFor(featureId) {
  const s = getStats();
  const b = s[featureId];
  if (!b || !b.count) return null;
  return b.sum / b.count;
}

export function getFeatureAvg10(featureId) {
  return avgFor(featureId);
}

export function getOverallAvg10() {
  const s = getStats();
  let sum = 0;
  let n = 0;
  for (const id of FEATURES) {
    const b = s[id];
    if (b && b.count) {
      sum += b.sum / b.count;
      n += 1;
    }
  }
  if (n === 0) return null;
  return sum / n;
}

export function avgToPercent(avg) {
  if (avg == null) return 0;
  return Math.round((avg / 10) * 100);
}

export function getDisplayName() {
  return getAccount()?.name ?? "";
}

export function getAccountField() {
  return getAccount()?.field ?? null;
}

export { FEATURES, makeDefaultStats };
