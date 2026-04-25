import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDisplayName,
  getFeatureAvg10,
  getOverallAvg10,
  avgToPercent,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
} from "../../lib/nexoraSession.js";
import faceStudent1 from "../../assets/face.png";
import faceStudent2 from "../../assets/face2.png";
import faceStudent3 from "../../assets/face3.jpg";
import "./home.scss";

const FEATURES = [
  {
    id: "scenario",
    theme: "scenario",
    rot: "-3deg",
    emoji: "🎭",
    title: "Jedan životni razgovor",
    description: "Kratak dijalog s AI klijentom, zatim ocena pristupa.",
    cta: "ZAPOČNI",
    to: "/simulacija",
    touch: "simulation",
  },
  {
    id: "notes",
    theme: "notes",
    rot: "4deg",
    emoji: "📝",
    title: "Beleške",
    description: "Kreiraj i uredi beleške po smeru.",
    cta: "OTVORI",
    to: "/notes",
    touch: "notes",
  },
  {
    id: "lectures",
    theme: "lectures",
    rot: "-2deg",
    emoji: "🎧",
    title: "Predavanja",
    description: "Audio / video sadržaj po oblasti.",
    cta: "ISTRAŽI",
    to: "/predavanja",
    touch: "lectures",
  },
  {
    id: "flashcards",
    theme: "flashcards",
    rot: "3.5deg",
    emoji: "🃏",
    title: "Flash cards",
    description: "Pitanje na jednoj strani, odgovor na drugoj — vežbaj gradivo tvog smera.",
    cta: "KRENI",
    to: "/flashcards",
    touch: "flashcards",
  },
  {
    id: "planner",
    theme: "planner",
    rot: "-2.2deg",
    emoji: "📅",
    title: "Planer učenja",
    description: "Raspored, ciljevi, podsjećaji za tvoj smer.",
    cta: "PREGLED",
    to: "/study-planner",
    touch: "study_planner",
  },
  {
    id: "fieldchat",
    theme: "fieldchat",
    rot: "2deg",
    emoji: "💬",
    title: "Chat Mudrosti",
    description: "Pitaj o oblasti koju učiš — u kontekstu tvog smera.",
    cta: "PREGLED",
    to: "/field-chat",
    touch: "field_chat",
  },
  {
    id: "aiquiz",
    theme: "aiquiz",
    rot: "-1.5deg",
    emoji: "❓",
    title: "AI kviz",
    description: "Kviz prema temi koju zadaš.",
    cta: "PREGLED",
    to: "/ai-quiz",
    touch: "ai_quiz",
  },
  {
    id: "sources",
    theme: "sources",
    rot: "2.8deg",
    emoji: "📎",
    title: "Obrada fajlova",
    description: "Okači ili nalepi tekst; odgovor AI samo iz tog sadržaja.",
    cta: "PREGLED",
    to: "/izvori-ai",
    touch: "sources_ai",
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

const CAROUSEL_GAP_PX = 20;

function useVisibleSlideCount() {
  const [n, setN] = useState(4);
  useEffect(() => {
    const mqNarrow = window.matchMedia("(max-width: 639px)");
    const mqTablet = window.matchMedia(
      "(min-width: 640px) and (max-width: 1023px)"
    );
    const read = () => {
      if (mqNarrow.matches) setN(1);
      else if (mqTablet.matches) setN(2);
      else setN(4);
    };
    read();
    mqNarrow.addEventListener("change", read);
    mqTablet.addEventListener("change", read);
    return () => {
      mqNarrow.removeEventListener("change", read);
      mqTablet.removeEventListener("change", read);
    };
  }, []);
  return n;
}

const Home = () => {
  const [field, setField] = useState(
    () => localStorage.getItem("selectedField") || "it"
  );
  const visibleCount = useVisibleSlideCount();
  const [startIndex, setStartIndex] = useState(0);
  const [stepPx, setStepPx] = useState(0);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const maxIndex = Math.max(0, FEATURES.length - visibleCount);
  const canPrev = startIndex > 0;
  const canNext = startIndex < maxIndex;

  const measureStep = useCallback(() => {
    const tr = trackRef.current;
    if (!tr) return;
    const first = tr.querySelector(".home-card");
    if (!first) return;
    const w = first.getBoundingClientRect().width;
    if (w > 0) setStepPx(w + CAROUSEL_GAP_PX);
  }, []);

  useLayoutEffect(() => {
    measureStep();
  }, [measureStep, visibleCount]);

  useEffect(() => {
    const v = viewportRef.current;
    if (!v) return undefined;
    const ro = new ResizeObserver(() => measureStep());
    ro.observe(v);
    window.addEventListener("resize", measureStep);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureStep);
    };
  }, [measureStep, visibleCount]);

  useEffect(() => {
    setStartIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex, visibleCount]);

  const offsetPx = stepPx * startIndex;

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    setStartIndex((i) => Math.max(0, i - 1));
  }, [canPrev]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    setStartIndex((i) => Math.min(maxIndex, i + 1));
  }, [canNext, maxIndex]);

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
    { label: "Planer učenja", key: "study_planner", color: "#ea580c" },
    { label: "Chat Mudrosti", key: "field_chat", color: "#06b6d4" },
    { label: "AI kviz", key: "ai_quiz", color: "#d97706" },
    { label: "Obrada fajlova", key: "sources_ai", color: "#6366f1" },
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

    <main className="home__main">

      <section className="home__hero">
        <h1 className="home__hero-title">
          Uči pametnije – <span className="home__hero-gradient">ne više</span>
        </h1>
        <p className="home__hero-subtitle">
          Interaktivni alati koji ti pomažu da bolje razumeš, vežbaš i napreduješ.
        </p>
      </section>

      <section className="home__features" aria-label="Funkcije, karusel">
        <div className="home__features__inner">
          <div className="home__carousel">
            <button
              type="button"
              className="home__carousel__btn home__carousel__btn--prev"
              onClick={goPrev}
              disabled={!canPrev}
              aria-label="Prethodne kartice"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 6L9 12l6 6" />
              </svg>
            </button>
            <div
              ref={viewportRef}
              className="home__carousel__viewport"
              style={{ ["--n"]: visibleCount }}
            >
              <div className="home__carousel__mask">
                <div className="home__carousel__clip">
                  <div
                    ref={trackRef}
                    className="home__features__row home__features__row--track"
                    style={{
                      transform: `translate3d(-${Number.isFinite(offsetPx) ? offsetPx : 0}px, 0, 0)`,
                    }}
                  >
                    {FEATURES.map((f) => (
                      <Link
                        key={f.id}
                        to={f.to}
                        className={`home-card home-card--${f.theme} home-card--link`}
                        style={{ "--rot": f.rot }}
                        onClick={() => {
                          if (f.touch) recordFeatureTouch(f.touch, null);
                        }}
                      >
                        {f.badge ? (
                          <span className="home-card__badge">{f.badge}</span>
                        ) : null}
                        <div className="home-card__visual" aria-hidden="true">
                          {f.emoji}
                        </div>
                        <div className="home-card__body">
                          <h2 className="home-card__title">{f.title}</h2>
                          <p className="home-card__desc">{f.description}</p>
                          <span className="home-card__btn">
                            {f.cta} →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="home__carousel__btn home__carousel__btn--next"
              onClick={goNext}
              disabled={!canNext}
              aria-label="Sledeće kartice"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

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

      <section className="home__whylearn" aria-labelledby="home-whylearn-h2">
        <h2 id="home-whylearn-h2" className="home__whylearn-title">
          Zašto će ti ovo pomoći u učenju?
        </h2>
        <p className="home__whylearn-sub">
          Naši alati koriste AI da ti olakšaju učenje i ubrzaju napredak.
        </p>
        <div className="home__whylearn-grid">
          <article className="home__whylearn-card home__whylearn-card--pink">
            <div className="home__whylearn-ic" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
            <h3 className="home__whylearn-card-title">Fokusirano učenje</h3>
            <p className="home__whylearn-card-desc">
              AI izdvaja najbitnije delove gradiva i uklanja distrakcije.
            </p>
          </article>
          <article className="home__whylearn-card home__whylearn-card--blue">
            <div className="home__whylearn-ic" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="home__whylearn-card-title">Sigurno i privatno</h3>
            <p className="home__whylearn-card-desc">
              Tvoji podaci i napredak su zaštićeni i vezani za tvoj nalog.
            </p>
          </article>
          <article className="home__whylearn-card home__whylearn-card--green">
            <div className="home__whylearn-ic" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
            </div>
            <h3 className="home__whylearn-card-title">Učenje bilo gde</h3>
            <p className="home__whylearn-card-desc">
              Pristupi svojim beleškama, karticama i kvizovima kad god želiš.
            </p>
          </article>
          <article className="home__whylearn-card home__whylearn-card--purple">
            <div className="home__whylearn-ic" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
                <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <h3 className="home__whylearn-card-title">Zajednica</h3>
            <p className="home__whylearn-card-desc">Poveži se sa drugima i uči zajedno brže.</p>
          </article>
        </div>
      </section>

      <div className="home__quote">
        <span className="home__quote-mark" aria-hidden="true">❝</span>
        <p className="home__quote-text">Uči pametno. Razumi duboko. Primeni sigurno.</p>
        <div className="home__quote-social" aria-label="Zajednica studenata">
          <div className="home__quote-avatars" aria-hidden>
            <span className="home__quote-av">
              <img className="home__quote-av-img" src={faceStudent1} alt="" width="32" height="32" decoding="async" />
            </span>
            <span className="home__quote-av">
              <img className="home__quote-av-img" src={faceStudent2} alt="" width="32" height="32" decoding="async" />
            </span>
            <span className="home__quote-av">
              <img className="home__quote-av-img" src={faceStudent3} alt="" width="32" height="32" decoding="async" />
            </span>
          </div>
          <p className="home__quote-proof">
            Pridružilo se <strong className="home__quote-proof-num">10.000+</strong> studenata
          </p>
        </div>
      </div>

    </main>
  </div>
  );
};

export default Home;
