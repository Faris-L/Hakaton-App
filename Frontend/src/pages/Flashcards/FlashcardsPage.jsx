import { useCallback, useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import {
  getAccountField,
  getDisplayName,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
} from "../../lib/nexoraSession.js";
import { fetchFlashcardSets } from "../../api/flashcardsApi.js";
import FlashcardSetCard from "./FlashcardSetCard.jsx";
import FlashcardEditor from "./FlashcardEditor.jsx";
import FlashcardPractice from "./FlashcardPractice.jsx";
import "../home/home.scss";
import "./flashcards.scss";

const ROTS = [
  "2.5deg",
  "-1.5deg",
  "1.2deg",
  "-2deg",
  "0.8deg",
  "-1.1deg",
  "1.8deg",
  "-0.6deg",
];

function FlashcardListView() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const me = getDisplayName();
  const navigate = useNavigate();

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const subj = getAccountField() || "it";
    try {
      const data = await fetchFlashcardSets(subj);
      setSets(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Ne mogu učitati setove.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <header className="fc-page__bar">
        <Link to="/home" className="fc-back">
          ← Početna
        </Link>
        {me ? <span className="fc-user">{me}</span> : <span className="fc-user-sp" />}
      </header>

      <div className="fc-page__intro">
        <h1 className="fc-page__h1">Flash cards</h1>
        <p className="fc-page__sub">
          Uči pojmove kroz brze kartice i proveri koliko znaš.
        </p>
        <div className="fc-page__tool">
          <button
            type="button"
            className="fc-page__new"
            onClick={() => navigate("new")}
          >
            + Novi set
          </button>
        </div>
      </div>

      <main className="fc-page__main">
        {err ? <p className="fc-err-block">{err}</p> : null}
        {loading ? (
          <p className="fc-muted">Učitavanje…</p>
        ) : sets.length === 0 ? (
          <p className="fc-empty">
            Još nema setova. Klik na „+ Novi set” ili poveži backend.
          </p>
        ) : (
          <div className="fc-page__grid">
            {sets.map((s, i) => (
              <FlashcardSetCard
                key={s.id}
                set={s}
                rot={ROTS[i % ROTS.length]}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default function FlashcardsPage() {
  const [field, setField] = useState(
    () => localStorage.getItem("selectedField") || "it"
  );

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(localStorage.getItem("selectedField") || "it");
  }, []);

  useEffect(() => {
    recordFeatureTouch("flashcards", null);
  }, []);

  return (
    <div className={`fc-wrap fc-wrap--${field}`}>
      <div className="fc-wrap__bg" aria-hidden="true" />
      <div className="fc-page">
        <Routes>
          <Route path="/" element={<FlashcardListView />} />
          <Route path="new" element={<FlashcardEditor />} />
          <Route path=":setId/edit" element={<FlashcardEditor />} />
          <Route path=":setId/practice" element={<FlashcardPractice />} />
        </Routes>
      </div>
    </div>
  );
}
