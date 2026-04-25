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

const JSON_SYSTEM = `Ti si tutor za "ko zna zna" stil. Odgovori ISKLJUČIVO validnim JSON-om na srpskom (latinica), bez komentara pre ili posle.

Format (tačno 5 stavki u nizu stavke):
{"stavke":[
  {"pitanje":"kratko pitanje?","odgovor":"tačno rešenje u 1–3 rečenice"},
  ... još 4 stavke
]}

Pitanja: konkretna, zanimljiva, prilagođena smeru i temi. Odgovori: tačni, jasni. Nema Markdovna, nema \`\`\` zaokruživača.`;

/**
 * Pokušaj da izvučeš { stavke: [{ pitanje, odgovor }] } iz modelovog odgovora.
 * @param {string} raw
 * @returns {{ pitanje: string, odgovor: string }[] | null}
 */
function parseKvizStavke(raw) {
  if (!raw || typeof raw !== "string") return null;
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  t = t.slice(start, end + 1);
  try {
    const o = JSON.parse(t);
    const arr = o.stavke ?? o.items;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr
      .slice(0, 8)
      .map((x) => {
        const p = x.pitanje ?? x.pitanja ?? x.q ?? x.question;
        const a = x.odgovor ?? x.tekst ?? x.a ?? x.answer;
        if (typeof p === "string" && typeof a === "string" && p.trim() && a.trim()) {
          return { pitanje: p.trim(), odgovor: a.trim() };
        }
        return null;
      })
      .filter(Boolean);
  } catch {
    return null;
  }
}

export default function AiQuizPage() {
  const [field, setField] = useState("it");
  const [topic, setTopic] = useState("");
  const [outRaw, setOutRaw] = useState("");
  const [items, setItems] = useState(/** @type {{ pitanje: string, odgovor: string }[] | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(getAccountField() || "it");
  }, []);

  const run = useCallback(async () => {
    const t = topic.trim();
    if (!t) return;
    setErr(null);
    setOutRaw("");
    setItems(null);
    setLoading(true);
    try {
      const label = FIELD_NAMES[field] || "Informatika";
      const { reply } = await postAiAsk({
        system: JSON_SYSTEM,
        message: `Smer: ${label}. Tema: ${t}. Napravi 5 pitanja u stilu "ko zna zna" i za svako daj tačno rešenje. JSON po uputstvu iz system poruke.`,
      });
      const text = reply || "";
      setOutRaw(text);
      const parsed = parseKvizStavke(text);
      setItems(parsed && parsed.length > 0 ? parsed : null);
      recordFeatureTouch("ai_quiz", null);
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
          <span className="aq__kicker">Ko zna zna</span>
          <h1 className="aq__title">AI kviz</h1>
          <p className="aq__lead">
            Unesi temu — dobijaš 5 pitanja i <strong>rešenja</strong> prilagođena tvom smeru, kao u kvizu „ko
            zna zna“.
          </p>
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
              {loading ? "Generišem…" : "Generiši 5 pitanja + rešenja"}
            </button>
          </form>
          {err ? <p className="aq__err">{err}</p> : null}

          {items && items.length > 0 ? (
            <div className="aq__result" role="region" aria-label="Pitanja i rešenja">
              <p className="aq__out-label">Pitanja i rešenja</p>
              <ol className="aq__list">
                {items.map((it, i) => (
                  <li key={i} className="aq__item">
                    <p className="aq__q">
                      <span className="aq__n">{i + 1}.</span> {it.pitanje}
                    </p>
                    <div className="aq__a-wrap">
                      <span className="aq__a-badge">Rešenje</span>
                      <p className="aq__a">{it.odgovor}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : outRaw && !loading ? (
            <div className="aq__out-wrap">
              <p className="aq__out-label" id="aq-raw-label">
                Odgovor modela
              </p>
              <p className="aq__fallback-hint">
                JSON nije prepoznat — prikazujem sirovi tekst. Pokušaj ponovo sa istom temom.
              </p>
              <div className="aq__out" role="region" aria-labelledby="aq-raw-label">
                {outRaw}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
