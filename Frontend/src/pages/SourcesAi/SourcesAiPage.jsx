import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { postAiAsk } from "../../api/client.js";
import { recordFeatureTouch, syncProfileFieldFromCurrentAccount } from "../../lib/nexoraSession.js";
import "./sourcesAi.scss";

const SYSTEM = `Odgovaraj isključivo na osnovu teksta koji korisnik daje ispod reči IZVORI. Ako u izvoru nema dovoljno podataka, napiši jednu rečenu: u tvom izvoru to nije pokriveno — i pokušaj reći šta fali. Nema izmišljanja. Srpski (latinica), jasno i kratko.`;
const MAX_FILE_BYTES = 1_200_000;

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function SourcesAiPage() {
  const [source, setSource] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [fileName, setFileName] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
  }, []);

  const onPickFile = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onFile = useCallback((e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setErr(`Fajl je prevelik (maks. ~${Math.round(MAX_FILE_BYTES / 1000)} KB).`);
      return;
    }
    setErr(null);
    const r = new FileReader();
    r.onload = () => {
      setSource(String(r.result || ""));
      setFileName(f.name);
    };
    r.onerror = () => setErr("Ne mogu pročitati fajl.");
    r.readAsText(f, "UTF-8");
  }, []);

  const resetAll = useCallback(() => {
    setSource("");
    setQuestion("");
    setAnswer("");
    setErr(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const canReset =
    Boolean(source.trim()) ||
    Boolean(question.trim()) ||
    Boolean(answer) ||
    Boolean(fileName) ||
    Boolean(err);

  const saveAnswer = useCallback(() => {
    const a = answer.trim();
    if (!a) return;
    const stamp = new Date().toISOString().slice(0, 19).replace("T", "-").replace(/:/g, "-");
    const head = `Nexora — Izvori + AI
Datum: ${new Date().toLocaleString("sr-Latn-RS", { timeZone: "Europe/Belgrade" })}

=== Pitanje ===
${question.trim()}

=== Odgovor (AI) ===
`;
    downloadTextFile(`nexora-izvori-odgovor-${stamp}.txt`, `${head}${a}
`);
  }, [answer, question]);

  const ask = useCallback(async () => {
    const s = source.trim();
    const q = question.trim();
    if (!s || !q) return;
    setErr(null);
    setAnswer("");
    setLoading(true);
    try {
      const { reply } = await postAiAsk({
        system: SYSTEM,
        message: `IZVORI:\n${s}\n\nPITANJE:\n${q}`,
      });
      setAnswer(reply || "—");
      recordFeatureTouch("sources_ai", null);
    } catch (e) {
      setErr(e?.message || "Neuspeh.");
    } finally {
      setLoading(false);
    }
  }, [source, question]);

  return (
    <div className="sa">
      <div className="sa__shell">
        <header className="sa__header" aria-label="Izvori + AI">
          <nav className="sa__nav" aria-label="Kretanje">
            <Link to="/home" className="sa__back">
              ← Početna
            </Link>
            <div style={{ width: "3.5rem" }} aria-hidden />
          </nav>
          <h1 className="sa__title">
            <span className="sa__title-txt">Izvori</span>
            <span className="sa__title-plus" aria-hidden>
              +
            </span>
            <span className="sa__title-txt sa__title-txt--ai">AI</span>
          </h1>
          <p className="sa__sub">
            Nalepi, učitaj fajl ili otkucaj sadržaj — model odgovara <strong>samo</strong> u okviru tog teksta.
          </p>
          <div className="sa__header-row">
            <button
              type="button"
              className="sa__ghost"
              onClick={resetAll}
              disabled={loading || !canReset}
              title="Očisti izvor, pitanje i odgovor (počinješ ispočetka)"
            >
              Počni iznova
            </button>
          </div>
        </header>
        <main className="sa__main">
          <input
            ref={fileRef}
            type="file"
            className="sa__file-input"
            accept=".txt,.md,.csv,.json,application/json,text/plain,text/csv"
            onChange={onFile}
            aria-hidden
            tabIndex={-1}
          />
          <section className="sa__panel sa__panel--source" aria-labelledby="sa-source">
            <div className="sa__field">
              <div className="sa__label-row">
                <span className="sa__label" id="sa-source">
                  Tvoj izvor
                </span>
                <div className="sa__upload-wrap">
                  <button type="button" className="sa__upload" onClick={onPickFile} disabled={loading}>
                    <span className="sa__upload-ic" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </span>
                    Učitaj fajl
                  </button>
                  {fileName ? (
                    <span className="sa__file-name" title={fileName}>
                      {fileName}
                    </span>
                  ) : null}
                </div>
              </div>
              <textarea
                id="sa-source"
                className="sa__ta"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Npr. odlomak iz skripte, ispitna pitanja, sažetak…"
                disabled={loading}
                aria-labelledby="sa-source"
              />
            </div>
          </section>
          <section className="sa__panel sa__panel--q" aria-labelledby="sa-q">
            <div className="sa__field">
              <span className="sa__label" id="sa-q">
                Pitanje
              </span>
              <textarea
                id="sa-q"
                className="sa__ta sa__ta--q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Šta te zanima iz gornjeg teksta?"
                disabled={loading}
                aria-labelledby="sa-q"
              />
            </div>
            <div className="sa__row" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className="sa__btn"
                onClick={ask}
                disabled={loading || !source.trim() || !question.trim()}
              >
                {loading ? "Odgovaram…" : "Odgovori iz izvora"}
              </button>
            </div>
          </section>
          {err ? <p className="sa__err">{err}</p> : null}
          {answer ? (
            <div className="sa__out" role="region" aria-label="Odgovor">
              <div className="sa__out-rail" aria-hidden />
              <div className="sa__out-inner">
                <div className="sa__out-head">
                  <span className="sa__out-kicker">Odgovor</span>
                  <button
                    type="button"
                    className="sa__save"
                    onClick={saveAnswer}
                    title="Preuzmi odgovor kao .txt fajl"
                  >
                    Sačuvaj .txt
                  </button>
                </div>
                {answer}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
