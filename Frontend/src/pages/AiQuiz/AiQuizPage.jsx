import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { postAiAsk } from "../../api/client.js";
import {
  FIELD_NAMES,
  getAccountField,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
} from "../../lib/nexoraSession.js";
import "./aiQuiz.scss";

export default function AiQuizPage() {
  const [field, setField] = useState("it");
  const [topic, setTopic] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(getAccountField() || "it");
    recordFeatureTouch("ai_quiz", null);
  }, []);

  const run = useCallback(async () => {
    const t = topic.trim();
    if (!t) return;
    setErr(null);
    setOut("");
    setLoading(true);
    try {
      const label = FIELD_NAMES[field] || "Informatika";
      const { reply } = await postAiAsk({
        system:
          "Ti si tutor. Samo pitanja na srpskom (latinica), numerisana 1) do 5), bez rešenja. Svako pitanje u jednom pasusu ili jednoj rečenici. Bez ukrasnog teksta ispred liste.",
        message: `Smer: ${label}. Tema: ${t}. Sastavi 5 pitanja za proveru znanja o ovoj temi. Budi konkretan i razumeš studenta fakulteta.`,
      });
      setOut(reply || "—");
    } catch (e) {
      setErr(e?.message || "Neuspeh.");
    } finally {
      setLoading(false);
    }
  }, [field, topic]);

  return (
    <div className="aq">
      <div className="aq__shell">
        <header className="aq__header" aria-label="AI kviz">
          <nav className="aq__nav" aria-label="Kretanje">
            <Link to="/home" className="aq__back">
              ← Početna
            </Link>
            <div style={{ width: "3.5rem" }} aria-hidden />
          </nav>
          <span className="aq__kicker">Provera znanja</span>
          <h1 className="aq__title">AI kviz</h1>
          <p className="aq__lead">Zadaj oblast; model predloži 5 pitanja prilagođenih tvom smeru.</p>
        </header>
        <main className="aq__main">
          <form
            className="aq__form"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            <span className="aq__label" id="aq-topic">
              Tema / oblast
            </span>
            <input
              id="aq-topic"
              className="aq__input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="npr. SQL indeksi, CNS neurotransmiteri, tržišna ravnoteža…"
              disabled={loading}
              aria-labelledby="aq-topic"
            />
            <button type="submit" className="aq__btn" disabled={loading || !topic.trim()}>
              {loading ? "Generišem…" : "Generiši 5 pitanja"}
            </button>
          </form>
          {err ? <p className="aq__err">{err}</p> : null}
          {out ? (
            <div className="aq__out-wrap">
              <p className="aq__out-label" id="aq-result-label">
                Pitanja
              </p>
              <div className="aq__out" role="region" aria-labelledby="aq-result-label">
                {out}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
