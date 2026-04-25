import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getDisplayName,
  getAccount,
  getAccountField,
  getFeatureAvg10,
  getOverallAvg10,
  avgToPercent,
  FIELD_NAMES,
  logoutSession,
  resetAllNexoraData,
  updateCurrentAccountProfile,
} from "../../lib/nexoraSession.js";
import "./profil.scss";

const TOOLS = [
  {
    key: "simulation",
    label: "Simulacija (razgovor)",
    desc: "Vežbaj kroz razgovor sa AI i testiraj svoje znanje.",
    to: "/simulacija",
    mod: "p",
  },
  {
    key: "notes",
    label: "Beleške",
    desc: "Kreiraj i uredi beleške po smeru.",
    to: "/notes",
    mod: "b",
  },
  {
    key: "lectures",
    label: "Predavanja",
    desc: "Audio / video sadržaj po oblasti.",
    to: "/predavanja",
    mod: "g",
  },
  {
    key: "flashcards",
    label: "Flash cards",
    desc: "Brze kartice za ponavljanje.",
    to: "/flashcards",
    mod: "o",
  },
  {
    key: "study_planner",
    label: "Planer učenja",
    desc: "Raspored, ciljevi i podsjećaji u pregledaču.",
    to: "/study-planner",
    mod: "a",
  },
  {
    key: "field_chat",
    label: "Chat za smer",
    desc: "Pitaj o oblasti koju trenutno učiš.",
    to: "/field-chat",
    mod: "c",
  },
  {
    key: "ai_quiz",
    label: "AI kviz",
    desc: "Generiši pitanja po unetoj temi.",
    to: "/ai-quiz",
    mod: "q",
  },
  {
    key: "sources_ai",
    label: "Izvori + AI",
    desc: "Odgovori samo na osnovu tvog teksta ili fajla.",
    to: "/izvori-ai",
    mod: "i",
  },
];

function toolIcon(mod) {
  const common = { width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (mod) {
    case "p":
      return <svg viewBox="0 0 24 24" aria-hidden {...common}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
    case "b":
      return <svg viewBox="0 0 24 24" aria-hidden {...common}><path d="M4 4h16v12H4z M8 4v16 M12 4v2 M4 8h16" /></svg>;
    case "g":
      return <svg viewBox="0 0 24 24" aria-hidden {...common}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2" /><path d="M9 9h6" /></svg>;
    case "o":
      return <svg viewBox="0 0 24 24" aria-hidden {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h6 M7 12h4" /></svg>;
    case "a":
      return <svg viewBox="0 0 24 24" aria-hidden {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M8 2v4 M16 2v4 M3 10h18" /></svg>;
    case "c":
      return <svg viewBox="0 0 24 24" aria-hidden {...common}><circle cx="12" cy="12" r="10" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>;
    case "q":
      return <svg viewBox="0 0 24 24" aria-hidden {...common}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>;
    case "i":
    default:
      return <svg viewBox="0 0 24 24" aria-hidden {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h4" /></svg>;
  }
}

function profileInitials(acc, displayName) {
  const fn = (acc?.firstName || "").trim();
  const ln = (acc?.lastName || "").trim();
  if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
  const n = (displayName || "").trim();
  if (n) return n[0].toUpperCase();
  return "?";
}

export default function Profil() {
  const navigate = useNavigate();
  const acc = getAccount();
  const field = getAccountField() || localStorage.getItem("selectedField") || "it";
  const name = getDisplayName();
  const overall = getOverallAvg10();
  const initial = profileInitials(acc, name);
  const username = acc?.name || "";

  const [editing, setEditing] = useState(false);
  const [dFn, setDFn] = useState("");
  const [dLn, setDLn] = useState("");
  const [dFac, setDFac] = useState("");
  const [dAddr, setDAddr] = useState("");

  useEffect(() => {
    if (!acc) return;
    setDFn(acc.firstName || "");
    setDLn(acc.lastName || "");
    setDFac(acc.faculty || "");
    setDAddr(acc.address || "");
  }, [acc]);

  const onSaveProfile = useCallback(
    (e) => {
      e.preventDefault();
      if (!dFn.trim() || dFn.trim().length < 2 || dLn.trim().length < 2) return;
      if (!dFac.trim() || dFac.trim().length < 2) return;
      if (!dAddr.trim() || dAddr.trim().length < 4) return;
      updateCurrentAccountProfile({
        firstName: dFn.trim(),
        lastName: dLn.trim(),
        faculty: dFac.trim(),
        address: dAddr.trim(),
      });
      setEditing(false);
    },
    [dFn, dLn, dFac, dAddr]
  );

  const onLogout = () => {
    logoutSession();
    navigate("/", { replace: true });
  };

  const onFullReset = () => {
    if (
      window.confirm(
        "Ovo briše nalog, ocene i izbor smera. Bićeš vraćen na uvod. Nastaviti?"
      )
    ) {
      resetAllNexoraData();
      document.body.classList.remove(
        "theme-medicine",
        "theme-psychology",
        "theme-economy",
        "theme-it"
      );
      navigate("/", { replace: true });
    }
  };

  return (
    <main className="profil">
      <div className="profil__bg" aria-hidden />

      <header className="profil__head">
        <Link to="/home" className="profil__back">
          ← Početna
        </Link>
        <h1 className="profil__h1">Profil</h1>
      </header>

      <section className="profil__user" aria-label="Korisnički nalog">
        <div className="profil__avatar-block">
          <div className="profil__avatar" aria-hidden>
            {initial}
          </div>
          <span className="profil__status" title="Aktivna sesija" aria-label="Aktivno" />
        </div>
        <div className="profil__user-main">
          <h2 className="profil__name">{name || "Nalog"}</h2>
          {acc?.createdAt ? (
            <p className="profil__since">
              nalog od {new Date(acc.createdAt).toLocaleDateString("sr-Latn-RS")}
            </p>
          ) : null}
          <p className="profil__field">
            <span className="profil__field-ic" aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
              </svg>
            </span>
            Smer: <strong>{FIELD_NAMES[field] || "Informatika"}</strong>
          </p>
        </div>
      </section>

      <section className="profil__details" aria-labelledby="profil-podatak-h2">
        <div className="profil__details-head">
          <h2 id="profil-podatak-h2" className="profil__h2">
            Podaci o studentu
          </h2>
          {!editing ? (
            <button
              type="button"
              className="profil__details-edit"
              onClick={() => setEditing(true)}
            >
              Uredi
            </button>
          ) : null}
        </div>
        {editing ? (
          <form className="profil__details-form" onSubmit={onSaveProfile}>
            <div className="profil__details-row2">
              <label className="profil__details-lab" htmlFor="p-fn">
                Ime
                <input
                  id="p-fn"
                  className="profil__details-inp"
                  value={dFn}
                  onChange={(e) => setDFn(e.target.value)}
                  minLength={2}
                  required
                />
              </label>
              <label className="profil__details-lab" htmlFor="p-ln">
                Prezime
                <input
                  id="p-ln"
                  className="profil__details-inp"
                  value={dLn}
                  onChange={(e) => setDLn(e.target.value)}
                  minLength={2}
                  required
                />
              </label>
            </div>
            <label className="profil__details-lab" htmlFor="p-fac">
              Fakultet / ustanova
              <input
                id="p-fac"
                className="profil__details-inp"
                value={dFac}
                onChange={(e) => setDFac(e.target.value)}
                minLength={2}
                required
              />
            </label>
            <label className="profil__details-lab" htmlFor="p-addr">
              Adresa
              <input
                id="p-addr"
                className="profil__details-inp"
                value={dAddr}
                onChange={(e) => setDAddr(e.target.value)}
                minLength={4}
                required
              />
            </label>
            <div className="profil__details-btns">
              <button type="submit" className="profil__details-save">
                Sačuvaj
              </button>
              <button
                type="button"
                className="profil__details-cancel"
                onClick={() => {
                  setEditing(false);
                  if (acc) {
                    setDFn(acc.firstName || "");
                    setDLn(acc.lastName || "");
                    setDFac(acc.faculty || "");
                    setDAddr(acc.address || "");
                  }
                }}
              >
                Otkaži
              </button>
            </div>
          </form>
        ) : (
          <ul className="profil__details-list">
            <li>
              <span className="profil__details-k">Ime</span>
              <span className="profil__details-v">{(acc?.firstName || "").trim() || "—"}</span>
            </li>
            <li>
              <span className="profil__details-k">Prezime</span>
              <span className="profil__details-v">{(acc?.lastName || "").trim() || "—"}</span>
            </li>
            <li>
              <span className="profil__details-k">Fakultet / ustanova</span>
              <span className="profil__details-v">{(acc?.faculty || "").trim() || "—"}</span>
            </li>
            <li>
              <span className="profil__details-k">Adresa</span>
              <span className="profil__details-v">{(acc?.address || "").trim() || "—"}</span>
            </li>
            <li>
              <span className="profil__details-k">Korisničko ime</span>
              <span className="profil__details-v profil__details-v--mono">@{username || "—"}</span>
            </li>
          </ul>
        )}
      </section>

      <div className="profil__avgbar" role="status" aria-label="Ukupan prosek">
        <span className="profil__avg-ic" aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
            <path d="M9.4 1.1L12 4.6l.4.6.7.1 4 .6-2.9 2.8-.5.5.1.7.7 4-3.6-1.9-.6-.3-.6.3-3.6 1.9.7-4 .1-.7-.5-.5-2.9-2.8 4-.6.7-.1.4-.6L12 4.6 9.4 1.1zM4 20h8v-2H4v2z" />
          </svg>
        </span>
        <span>
          Ukupan prosek AI ocena:{" "}
          <strong>
            {overall != null
              ? `${overall.toFixed(2)} / 10 (${avgToPercent(overall)}%)`
              : "—"}
          </strong>
        </span>
      </div>

      <h2 className="profil__h2">Po alatima</h2>
      <ul className="profil__tools">
        {TOOLS.map((t) => {
          const a = getFeatureAvg10(t.key);
          return (
            <li key={t.key}>
              <Link to={t.to} className={`profil__tool profil__tool--${t.mod}`}>
                <span className="profil__tool-ic" aria-hidden>
                  {toolIcon(t.mod)}
                </span>
                <div className="profil__tool-mid">
                  <span className="profil__tool-title">{t.label}</span>
                  <span className="profil__tool-desc">{t.desc}</span>
                </div>
                <div className="profil__tool-end">
                  <span className="profil__tool-score">
                    {a != null ? `${a.toFixed(2)}/10` : "—"}
                  </span>
                  <span className="profil__chev" aria-hidden>›</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="profil__info" role="note">
        <span className="profil__info-ic" aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </span>
        <p>
          Ocene iz simulacije dolaze sa servera; ostali alati (uključujući Izvore + AI, kviz, chat
          i planer) beleže interakciju i prosek po nalogu. Isti progres se nastavlja ulogavanjem
          istim imenom i smerom. Posle odjave na uvodu možeš otvoriti drugi nalog; stari ostaje
          zapamćen.
        </p>
      </div>

      <div className="profil__actions">
        <button type="button" className="profil__btn" onClick={onLogout}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Odjavi se
        </button>
        <button type="button" className="profil__btn profil__btn--danger" onClick={onFullReset}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="3,6 5,6 21,6" />
            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
          </svg>
          Resetuj sve (uvod + nalog)
        </button>
      </div>
    </main>
  );
}
