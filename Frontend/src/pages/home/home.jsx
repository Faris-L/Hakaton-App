import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDisplayName,
  getFeatureAvg10,
  getOverallAvg10,
  avgToPercent,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
} from "../../lib/nexoraSession.js";
import "./home.scss";

const STAT_ID = {
  scenario: "simulation",
  notes: "notes",
  lectures: "lectures",
  flashcards: "flashcards",
};

const features = [
  {
    id: "scenario",
    rot: "-3deg",
    emoji: "🎭",
    title: "Jedan životni razgovor",
    description: "Kratak dijalog s AI klijentom, pa ocena pristupa — bez niza scenarija.",
    cta: "ZAPOČNI",
  },
  {
    id: "notes",
    rot: "4deg",
    emoji: "📝",
    title: "Beleške",
    description: "Pravi, uredi i organizuj beleške po temama i predmetima.",
    cta: "OTVORI",
  },
  {
    id: "lectures",
    rot: "-2deg",
    emoji: "🎧",
    title: "Slušaj predavanja",
    description: "Pristupaj audio i video predavanjima po predmetima.",
    cta: "ISTRAŽI",
  },
  {
    id: "flashcards",
    rot: "3.5deg",
    emoji: "🃏",
    title: "Flash cards",
    description: "Uči pojmove kroz brze kartice — idealno za ponavljanje.",
    cta: "KRENI",
  },
];

const FIELD_NAMES = {
  medicine:   "Medicina",
  psychology: "Psihologija",
  economy:    "Ekonomija",
  it:         "Informatika",
};

const FIELD_ICONS = {
  medicine: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true" className="home__nav-field-icon">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  psychology: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true" className="home__nav-field-icon">
      <text x="12" y="18" textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="serif">Ψ</text>
    </svg>
  ),
  economy: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true" className="home__nav-field-icon">
      <path d="M3 3v18h2V3H3zm3 0v12h2V3H6zm3 0v6h2V3H9zm3 0v9h2V3h-2zm3 0v4h2V3h-2z" />
    </svg>
  ),
  it: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" aria-hidden="true" className="home__nav-field-icon">
      <rect x="2" y="4" width="20" height="12" rx="1.5" />
      <path d="M8 10.5L6 12.5l2 2" />
      <path d="M16 10.5l2 2-2 2" />
      <line x1="11" y1="14" x2="13" y2="10" />
    </svg>
  ),
};

const Home = () => {
  const [field, setField] = useState(
    () => localStorage.getItem("selectedField") || "it"
  );

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(localStorage.getItem("selectedField") || "it");
  }, []);

  const fieldName = FIELD_NAMES[field] || "Informatika";
  const me = getDisplayName();
  const overallAvg = getOverallAvg10();
  const overallPct = overallAvg != null ? avgToPercent(overallAvg) : null;
  const progressRows = [
    { label: "Simulacija (razgovor)", key: "simulation", color: "#f06292" },
    { label: "Beleške", key: "notes", color: "#3b82f6" },
    { label: "Predavanja", key: "lectures", color: "#8b5cf6" },
    { label: "Flash cards", key: "flashcards", color: "#22c55e" },
  ].map((r) => {
    const a = getFeatureAvg10(r.key);
    return {
      ...r,
      pct: a != null ? avgToPercent(a) : null,
    };
  });

  return (
  <div className={`home home--${field}`}>
    <div className="home__bg" aria-hidden="true" />

    {/* ── Navbar ─────────────────────────────────────────── */}
    <nav className="home__nav">
      <div className="home__nav-start">
        {FIELD_ICONS[field]}
        <div className="home__nav-block">
          <span className="home__nav-label">{fieldName}</span>
          {me ? <span className="home__nav-user">Zdravo, {me}</span> : null}
        </div>
      </div>

      <div className="home__nav-logo-wrap">
        <svg className="home__nav-logo" viewBox="0 0 300 54" xmlns="http://www.w3.org/2000/svg">
          <polyline points="18,18 18,8 32,8"   fill="none" stroke="#00E5C4" strokeWidth="1.3" />
          <polyline points="282,18 282,8 268,8" fill="none" stroke="#00E5C4" strokeWidth="1.3" />
          <polyline points="18,36 18,46 32,46"   fill="none" stroke="#00E5C4" strokeWidth="1.3" />
          <polyline points="282,36 282,46 268,46" fill="none" stroke="#00E5C4" strokeWidth="1.3" />
          <circle cx="18"  cy="8"  r="2" fill="#00E5C4" />
          <circle cx="282" cy="8"  r="2" fill="#00E5C4" />
          <circle cx="18"  cy="46" r="2" fill="#00E5C4" />
          <circle cx="282" cy="46" r="2" fill="#00E5C4" />
          <text x="150" y="37" fontFamily="'Courier New', Courier, monospace" fontSize="30" fontWeight="700" letterSpacing="5" fill="#0f172a" textAnchor="middle">
            NEX<tspan fill="#00E5C4">O</tspan>RA
          </text>
        </svg>
      </div>

      <div className="home__nav-end">
        <Link to="/profil" className="home__nav-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>PROFIL</span>
        </Link>
      </div>
    </nav>

    {/* ── Main ───────────────────────────────────────────── */}
    <main className="home__main">

      {/* Hero */}
      <section className="home__hero">
        <h1 className="home__hero-title">
          Izaberi <span className="home__hero-gradient">način učenja</span>.
        </h1>
        <p className="home__hero-subtitle">
          Interaktivni alati koji ti pomažu da bolje razumeš, vežbaš i napreduješ.
        </p>
      </section>

      {/* Feature cards */}
      <div className="home__grid">
        {features.map((f) => {
          const statId = STAT_ID[f.id];
          const body = (
            <>
              <div className="home-card__visual" aria-hidden="true">{f.emoji}</div>
              <div className="home-card__body">
                <h2 className="home-card__title">{f.title}</h2>
                <p className="home-card__desc">{f.description}</p>
                {f.id === "scenario" ? (
                  <span className="home-card__btn">{f.cta} →</span>
                ) : (
                  <button
                    type="button"
                    className="home-card__btn"
                    onClick={() => {
                      recordFeatureTouch(statId, null);
                    }}
                  >
                    {f.cta} →
                  </button>
                )}
              </div>
            </>
          );
          return f.id === "scenario" ? (
            <Link
              key={f.id}
              to="/simulacija"
              className={`home-card home-card--${f.id} home-card--link`}
              style={{ "--rot": f.rot }}
            >
              {body}
            </Link>
          ) : (
            <article
              key={f.id}
              className={`home-card home-card--${f.id}`}
              style={{ "--rot": f.rot }}
            >
              {body}
            </article>
          );
        })}
      </div>

      {/* Progress panel */}
      <div className="home__progress">
        <div className="home__progress-header">
          <div className="home__progress-icon" aria-hidden="true">
            <svg viewBox="0 0 36 28" xmlns="http://www.w3.org/2000/svg" width="48" height="38">
              <rect x="0"  y="16" width="8" height="12" rx="2" fill="#f06292" />
              <rect x="13" y="8"  width="8" height="20" rx="2" fill="#3b82f6" />
              <rect x="26" y="0"  width="8" height="28" rx="2" fill="#22c55e" />
            </svg>
          </div>
          <div className="home__progress-info">
            <strong className="home__progress-title">Prati svoj napredak</strong>
            <span className="home__progress-sub">Pogledaj statistiku svog učenja i ostvari svoje ciljeve.</span>
          </div>
          <div className="home__progress-score">
            <span className="home__progress-pct">
              {overallPct != null ? `${overallPct}%` : "—"}
            </span>
            <span className="home__progress-pct-label">prosek (AI)</span>
          </div>
        </div>

        <div className="home__progress-bars">
          {progressRows.map((item) => (
            <div key={item.label} className="home__progress-row">
              <span className="home__progress-label">{item.label}</span>
              <div className="home__progress-bar">
                <div
                  className="home__progress-fill"
                  style={{
                    width: `${item.pct != null ? item.pct : 0}%`,
                    "--bar": item.color,
                  }}
                />
              </div>
              <span className="home__progress-num">{item.pct != null ? `${item.pct}%` : "—"}</span>
            </div>
          ))}
        </div>

        <Link to="/profil" className="home__progress-link home__progress-link--as-btn">
          OTVORI STATISTIKU →
        </Link>
      </div>

      {/* Feature highlights */}
      <div className="home__features">
        <div className="home__feature">
          <span className="home__feature-icon" style={{ "--fi": "#f06292" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
          </span>
          <div>
            <strong className="home__feature-title">Fokusirano učenje</strong>
            <p className="home__feature-desc">Alati dizajnirani da ti pomognu da ostaneš fokusiran.</p>
          </div>
        </div>
        <div className="home__feature">
          <span className="home__feature-icon" style={{ "--fi": "#3b82f6" }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2L3 7v6c0 5.3 3.8 9.7 9 10.9C17.2 22.7 21 18.3 21 13V7L12 2z" />
            </svg>
          </span>
          <div>
            <strong className="home__feature-title">Sigurno i privatno</strong>
            <p className="home__feature-desc">Tvoji podaci su zaštićeni. Uči bez brige.</p>
          </div>
        </div>
        <div className="home__feature">
          <span className="home__feature-icon" style={{ "--fi": "#06b6d4" }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4C7.58 4 4 7.58 4 12s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </span>
          <div>
            <strong className="home__feature-title">Sinhronizuj se</strong>
            <p className="home__feature-desc">Pristupi svom sadržaju bilo gde, bilo kada.</p>
          </div>
        </div>
        <div className="home__feature">
          <span className="home__feature-icon" style={{ "--fi": "#8b5cf6" }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </span>
          <div>
            <strong className="home__feature-title">Zajednica</strong>
            <p className="home__feature-desc">Poveži se sa drugima i razmenjuj znanje.</p>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="home__quote">
        <span className="home__quote-mark" aria-hidden="true">❝</span>
        <p className="home__quote-text">Uči pametno. Razumi duboko. Primeni sigurno.</p>
      </div>

    </main>
  </div>
  );
};

export default Home;