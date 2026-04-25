const K = {
  fieldCommitted: "nexoraFieldCommitted",
  account: "nexoraAccount",
  session: "nexoraSession",
  stats: "nexoraStats",
  registry: "nexoraAccountsRegistry",
  currentUser: "nexoraCurrentUser",
};

const FEATURES = [
  "simulation",
  "notes",
  "lectures",
  "flashcards",
  "study_planner",
  "field_chat",
  "ai_quiz",
  "sources_ai",
];

export const FIELD_NAMES = {
  medicine: "Medicina",
  economy: "Ekonomija",
  psychology: "Psihologija",
  it: "Informatika",
};

const INPUT_PLACEHOLDERS = {
  it: {
    aiQuizTopic: "npr. SQL indeksi, vremenska složenost, async/await, HTTP…",
    flashTitle: "npr. Baze podataka — transakcije i indeksi",
    flashGenTopic: "npr. rekurzija, keš, JWT, validacija ulaza",
    studyTask: "npr. Reši zadatak sa petljama, skica REST rute, debug izlaza",
    simAnswer: "Napiši odgovor: objašnjenje, primer koda, sledeći korak…",
    sourcesPaste: "Npr. odlomak koda, dokumentacija, pitanja sa kolokvijuma…",
    sourcesQuestion: "Šta pitaš o ovom kodu, algoritmu ili očekivanim test slučajevima?",
    fieldChat: "Npr. u čemu je greška, šta vraća upit, složenost algoritma…",
  },
  medicine: {
    aiQuizTopic: "npr. anemija, EKG, insulinska terapija, Cushing, troponin…",
    flashTitle: "npr. Endokrinologija ispit, kardio farmak, digestiv",
    flashGenTopic: "npr. dejstvo ACE inhibitora, DVT dijagnoza, uobičajeni CRP, toksičnost leka",
    studyTask: "npr. Ponovi patofiziologiju infarkta, kriterijum za anemiju",
    simAnswer: "Napiši kako bi odgovorio pacijentu: savet, tumačenje, sledeći korak…",
    sourcesPaste: "Npr. smernice, stav pitanja sa ispit, sažetak sa predavanja…",
    sourcesQuestion: "Šta iz ovog pasusa treba pojašnjenje (dijagnoza, lek, kriterijum)?",
    fieldChat: "Npr. kriterijum dijagnoze, mehanizam leka, tumačenje laboratorije…",
  },
  economy: {
    aiQuizTopic: "npr. tržišna ravnoteža, monopol, kamate, BDP, fiskalna politika…",
    flashTitle: "npr. Mikroekonomija — cena i ponuda",
    flashGenTopic: "npr. efikasnost Pareto, inflacija, devalvacija, budžetska restrikcija",
    studyTask: "npr. Zadatak s elastičnošću, graf krive ponude, maks. profit",
    simAnswer: "Napiši odgovor: brojke, ograničenja, jasan strateški savet…",
    sourcesPaste: "Npr. izvod iz člana, tabela, pitanja sa ispitne liste…",
    sourcesQuestion: "Šta iz tabele/teksta treba tumačiti, izračunati ili povezati?",
    fieldChat: "Npr. šta pomeri krivu ponude, dejstvo poreza, očekivanja…",
  },
  psychology: {
    aiQuizTopic: "npr. KBT tehnike, stres, validacija, Piaget, etika istraživanja…",
    flashTitle: "npr. Klinička psih. — anksioznost, psihometrija",
    flashGenTopic: "npr. kognitivne iskrivljenja, faze promene, locus kontrole, ljestve i validnost",
    studyTask: "npr. Kartica: interpretacija ljestvica, protokol u vežbi, slučaj",
    simAnswer: "Napiši odgovor: empatičan, u skladu s principom, bez suđenja, sledeći korak…",
    sourcesPaste: "Npr. odlomak skripte, opis slučaja, stav pitanja…",
    sourcesQuestion: "Kako ovo primeniti u vežbi, ili šta znači rezultat testa u kontekstu?",
    fieldChat: "Npr. iskrivljenje u mislima, faza prilagođavanja, etički dillema…",
  },
};

export function getInputPlaceholder(fieldId, part) {
  const id =
    fieldId && INPUT_PLACEHOLDERS[fieldId] ? fieldId : "it";
  const row = INPUT_PLACEHOLDERS[id];
  return row[part] || INPUT_PLACEHOLDERS.it[part] || "";
}

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
    return migrateRegistryProfiles(reg);
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
      firstName: "",
      lastName: "",
      faculty: "",
      address: "",
    };
    localStorage.removeItem(K.account);
    if (localStorage.getItem(K.stats) != null) {
      localStorage.removeItem(K.stats);
    }
  }
  localStorage.setItem(K.registry, JSON.stringify(migrated));
  return migrateRegistryProfiles(migrated);
}

function migrateRegistryProfiles(reg) {
  if (!reg || typeof reg !== "object") return reg;
  let dirty = false;
  for (const k of Object.keys(reg)) {
    const a = reg[k];
    if (!a || typeof a !== "object") continue;
    if (
      a.firstName === undefined ||
      a.lastName === undefined ||
      a.faculty === undefined ||
      a.address === undefined
    ) {
      reg[k] = normalizeAccountProfile(a);
      dirty = true;
    }
  }
  if (dirty) saveRegistry(reg);
  return reg;
}

function saveRegistry(reg) {
  localStorage.setItem(K.registry, JSON.stringify(reg));
}

function normalizeAccountProfile(a) {
  if (!a || typeof a !== "object") return a;
  return {
    ...a,
    firstName: typeof a.firstName === "string" ? a.firstName : "",
    lastName: typeof a.lastName === "string" ? a.lastName : "",
    faculty: typeof a.faculty === "string" ? a.faculty : "",
    address: typeof a.address === "string" ? a.address : "",
  };
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

export function getAccount() {
  if (localStorage.getItem(K.session) !== "1") return null;
  const k = getCurrentUserKey();
  if (!k) return null;
  const reg = ensureRegistry();
  const a = reg[k];
  if (!a) return null;
  return normalizeAccountProfile(a);
}

export function syncProfileFieldFromCurrentAccount() {
  const a = getAccount();
  if (!a?.field) return;
  localStorage.setItem("selectedField", a.field);
  localStorage.setItem("hasSelectedOption", "true");
  localStorage.setItem(K.fieldCommitted, "1");
  applyFieldThemeForBody(a.field);
}

export function tryLoginOrRegister(nameRaw, passRaw, profile = null) {
  const name = (nameRaw || "").trim();
  const pass = passRaw || "";
  const isRegister = profile?.register === true;

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
  const existing = reg[key] ? normalizeAccountProfile(reg[key]) : null;

  if (existing) {
    if (isRegister) {
      return {
        ok: false,
        error: "Korisničko ime je zauzeto. Pređi na „Prijavljivanje” ili unesi drugo ime.",
      };
    }
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

  if (!isRegister) {
    return {
      ok: false,
      error:
        "Nalog s tim korisničkim imenom ne postoji. Na tabu „Kreiraj nalog” možeš da se registruješ.",
    };
  }

  const firstName = (profile?.firstName || "").trim();
  const lastName = (profile?.lastName || "").trim();
  const faculty = (profile?.faculty || "").trim();
  const address = (profile?.address || "").trim();

  if (firstName.length < 2) {
    return { ok: false, error: "Ime: najmanje 2 znaka." };
  }
  if (lastName.length < 2) {
    return { ok: false, error: "Prezime: najmanje 2 znaka." };
  }
  if (faculty.length < 2) {
    return { ok: false, error: "Fakultet / ustanova: unesi naziv (npr. FON, ETF…)." };
  }
  if (address.length < 4) {
    return { ok: false, error: "Adresa: unesi ulicu, grad (npr. Bulevar 1, Beograd)." };
  }

  const acc = {
    name,
    passEnc: simpleEnc(pass),
    field,
    createdAt: new Date().toISOString(),
    stats: makeDefaultStats(),
    firstName,
    lastName,
    faculty,
    address,
  };
  reg[key] = acc;
  saveRegistry(reg);
  setCurrentUserKey(key);
  setSessionActive(true);
  syncProfileFieldFromCurrentAccount();
  return { ok: true, isNew: true };
}

export function updateCurrentAccountProfile(patch) {
  const k = getCurrentUserKey();
  if (!k || localStorage.getItem(K.session) !== "1") return false;
  const reg = ensureRegistry();
  const a = reg[k] ? normalizeAccountProfile(reg[k]) : null;
  if (!a) return false;
  for (const key of ["firstName", "lastName", "faculty", "address"]) {
    if (patch[key] !== undefined) a[key] = String(patch[key] ?? "").trim();
  }
  reg[k] = a;
  saveRegistry(reg);
  return true;
}

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
  const a = getAccount();
  if (!a) return "";
  const fn = (a.firstName || "").trim();
  const ln = (a.lastName || "").trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
  return a.name || "";
}

export function getAccountField() {
  return getAccount()?.field ?? null;
}

export { FEATURES, makeDefaultStats };
