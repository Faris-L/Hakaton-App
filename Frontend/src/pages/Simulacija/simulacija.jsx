import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postJson } from "../../api/client.js";
import { recordAiScore, syncProfileFieldFromCurrentAccount } from "../../lib/nexoraSession.js";
import "./simulacija.scss";

const FIELD_NAMES = {
  medicine: "Medicina",
  psychology: "Psihologija",
  economy: "Ekonomija",
  it: "Informatika",
};

const THEME_BODY = {
  medicine: "theme-medicine",
  psychology: "theme-psychology",
  economy: "theme-economy",
  it: "theme-it",
};

const ALL_THEMES = Object.values(THEME_BODY);

const DEFAULT_MIN = 20;

function getField() {
  const s = localStorage.getItem("selectedField");
  if (s === "medicine" || s === "psychology" || s === "economy" || s === "it")
    return s;
  return "it";
}

/** @param {{ role: string, text: string }[]} list */
function toApiMessages(list) {
  return list.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.text,
  }));
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** @returns {typeof window.webkitSpeechRecognition | null} */
function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function FieldBadgeIcon({ field }) {
  const c = { className: "sim-badge__ic", "aria-hidden": true, width: 20, height: 20 };
  switch (field) {
    case "psychology":
      return (
        <svg {...c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M9.5 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM7 8c0-1.1.5-2.1 1.3-2.7M4.2 5.1A5 5 0 0 0 2 8.5" strokeLinecap="round" />
          <path
            d="M14.5 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17 8c0-1.1-.5-2.1-1.3-2.7M19.8 5.1A5 5 0 0 1 22 8.5"
            strokeLinecap="round"
          />
          <path
            d="M12 11c-2.2 0-4 1.3-4.7 3.1M7 22v-1c0-2.2 1.8-4 4-4h2c2.2 0 4-1.8 4-4v-1"
            strokeLinecap="round"
          />
        </svg>
      );
    case "medicine":
      return (
        <svg {...c} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case "economy":
      return (
        <svg {...c} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3v18h2V3H3zm3 0v12h2V3H6zm3 0v6h2V3H9zm3 0v9h2V3h-2zm3 0v4h2V3h-2z" />
        </svg>
      );
    default:
      return (
        <svg {...c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="4" width="20" height="12" rx="1.5" />
        </svg>
      );
  }
}

export default function Simulacija() {
  const navigate = useNavigate();
  const [field, setField] = useState(getField);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MIN * 60);
  const [voiceListening, setVoiceListening] = useState(false);
  const fileRef = useRef(null);
  const speechRef = useRef(null);

  const fieldName = FIELD_NAMES[field] || "Informatika";
  const hasUserMessage = messages.some((m) => m.role === "user");

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(getField());
  }, []);

  useEffect(() => {
    const t = THEME_BODY[field] || THEME_BODY.it;
    document.body.classList.remove(...ALL_THEMES);
    document.body.classList.add(t);
    return () => {
      document.body.classList.remove(t);
    };
  }, [field]);

  useEffect(() => {
    if (!started || feedback) return;
    const id = setInterval(() => {
      setSecondsLeft((n) => (n <= 0 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [started, feedback]);

  const stopVoice = useCallback(() => {
    const r = speechRef.current;
    if (r) {
      try {
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
        r.stop();
      } catch {
        /* ignore */
      }
      speechRef.current = null;
    }
    setVoiceListening(false);
  }, []);

  const onVoice = useCallback(() => {
    if (feedback || !started) return;

    if (voiceListening) {
      stopVoice();
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError(
        "Glas u tekst trenutno radi u Chrome, Edge i Safari (macOS). " +
          "Nema podrške u Firefoxu u ovom režimu — napiši odgovor u polje."
      );
      return;
    }

    setError("");
    const rec = new Ctor();
    rec.lang = "sr-RS";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          chunk += event.results[i][0].transcript;
        }
      }
      if (chunk) {
        setInput((prev) => {
          const t = (prev + (prev && !prev.endsWith(" ") ? " " : "") + chunk).trim();
          return t;
        });
      }
    };

    rec.onerror = (e) => {
      if (e.error === "aborted" || e.error === "not-allowed") {
        setError(
          e.error === "not-allowed"
            ? "Dozvoli pristup mikrofonu u pregledaču da bi prepoznavanje rada."
            : ""
        );
      } else {
        setError(e.message || "Greška pri snimanju glasa. Pokušaj ponovo.");
      }
      setVoiceListening(false);
      speechRef.current = null;
    };

    rec.onend = () => {
      setVoiceListening(false);
      speechRef.current = null;
    };

    try {
      rec.start();
      speechRef.current = rec;
      setVoiceListening(true);
    } catch (e) {
      setError(e?.message || "Nije moguće pokrenuti glas. Pokušaj ponovo.");
    }
  }, [feedback, started, voiceListening, stopVoice]);

  useEffect(() => {
    return () => {
      if (speechRef.current) {
        try {
          speechRef.current.stop();
        } catch {
          /* ignore */
        }
        speechRef.current = null;
      }
    };
  }, []);

  const startConversation = useCallback(async () => {
    stopVoice();
    setError("");
    setLoading(true);
    try {
      const data = await postJson("/simulation/start", { field });
      if (data.error) throw new Error(data.error);
      const n = {
        role: "ai",
        text: data.assistant_message,
        id: `ai-start-${Date.now()}`,
        label: "AI simulacija",
      };
      setMessages([n]);
      setSecondsLeft(DEFAULT_MIN * 60);
      setStarted(true);
      setFeedback(null);
      setInput("");
    } catch (e) {
      setError(e.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }, [field, stopVoice]);

  const onKreni = () => {
    if (loading) return;
    setMessages([]);
    setFeedback(null);
    startConversation();
  };

  const onSend = async () => {
    const t = input.trim();
    if (!t || !started || feedback || loading) return;
    stopVoice();
    setError("");

    const timeStr = new Date().toLocaleTimeString("sr-RS", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const umsg = { role: "user", text: t, time: timeStr, id: `u-${Date.now()}` };
    const next = [...messages, umsg];
    setInput("");
    setLoading(true);

    try {
      const userTurns = next.filter((m) => m.role === "user").length;
      const data = await postJson("/simulation/turn", {
        field,
        user_turns: userTurns,
        messages: toApiMessages(next),
      });
      if (data.error) throw new Error(data.error);

      const aimsg = {
        role: "ai",
        text: data.assistant_message,
        id: `ai-${Date.now()}`,
        label: "AI simulacija",
      };
      const withAi = [...next, aimsg];
      setMessages(withAi);

      if (data.end_conversation) {
        const ev = await postJson("/simulation/evaluate", {
          field,
          messages: toApiMessages(withAi),
        });
        if (ev.error) throw new Error(ev.error);
        recordAiScore("simulation", ev.score);
        setFeedback({
          score: ev.score,
          summary: ev.summary,
          good: ev.good || [],
          improve: ev.improve || [],
          ideal: ev.ideal,
        });
      }
    } catch (e) {
      setError(e.message || "Slanje nije uspelo.");
    } finally {
      setLoading(false);
    }
  };

  const onZavrsiSimulaciju = async () => {
    if (feedback || loading || !started) return;
    if (!hasUserMessage) {
      setError("Napiši bar jedan odgovor u razgovoru, pa završi, ili pritisni „Pošalji” kad klijent zahvali.");
      return;
    }
    stopVoice();
    setError("");
    setLoading(true);
    try {
      const data = await postJson("/simulation/evaluate", {
        field,
        messages: toApiMessages(messages),
      });
      if (data.error) throw new Error(data.error);
      recordAiScore("simulation", data.score);
      setFeedback({
        score: data.score,
        summary: data.summary,
        good: data.good || [],
        improve: data.improve || [],
        ideal: data.ideal,
      });
    } catch (e) {
      setError(e.message || "Ocenjivanje nije uspelo.");
    } finally {
      setLoading(false);
    }
  };

  const onNovaSimulacija = () => {
    setFeedback(null);
    setMessages([]);
    setInput("");
    setStarted(false);
    setError("");
  };

  const onAttach = () => fileRef.current?.click();
  const onFile = () => {
    setError("Prilog će uskoro biti povezan sa bekapom. Za sada koristi tekst.");
  };

  return (
    <div className={`sim sim--${field}`}>
      <header className="sim-top">
        <div className="sim-top__inner">
          <button type="button" className="sim-back" onClick={() => navigate(-1)} aria-label="Nazad">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Nazad</span>
          </button>

          <div className="sim-logo-wrap" aria-hidden>
            <svg className="sim-logo" viewBox="0 0 300 54" xmlns="http://www.w3.org/2000/svg">
              <text
                x="150"
                y="37"
                fontFamily="ui-monospace, 'Courier New', monospace"
                fontSize="30"
                fontWeight="700"
                letterSpacing="5"
                fill="#0f172a"
                textAnchor="middle"
              >
                NEX
                <tspan fill="var(--sim-accent)">O</tspan>RA
              </text>
            </svg>
          </div>

          <Link to="/profil" className="sim-profil">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profil</span>
          </Link>
        </div>
      </header>

      <div className="sim-head">
        <div className="sim-head__row">
          <div className="sim-badge">
            <FieldBadgeIcon field={field} />
            <span>{fieldName}</span>
          </div>
          <button
            type="button"
            className="sim-cta"
            onClick={onKreni}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            {started ? "Počni iznova" : "Kreni simulaciju"}
          </button>
        </div>
        <h1 className="sim-title">Jedan životni razgovor</h1>
        <p className="sim-sub">
          Uloga klijenta (AI) je da vodi <strong>logičan, realan</strong> dijalog; kada mu odgovor
          odgovara ili ne, može reći to i zatvoriti — ili ti pritisneš „Završi simulaciju”. Nema
          fiksnog broja poruka. Zatim sledi ocena.
        </p>
      </div>

      {error ? (
        <p className="sim-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="sim-layout">
        <div className="sim-chat">
          <div className="sim-chat__status sim-chat__status--row">
            <span>
              {started ? "Jedan razgovor" : "Nije pokrenuto"}
            </span>
            <div className="sim-chat__status-right">
              {started && !feedback ? (
                <button
                  type="button"
                  className="sim-end-chat"
                  onClick={onZavrsiSimulaciju}
                  disabled={loading}
                >
                  Završi simulaciju
                </button>
              ) : null}
              <span className="sim-chat__timer" title="Vreme do kraja režimskog ograničenja">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </svg>
                {formatTime(Math.max(0, secondsLeft))}
              </span>
            </div>
          </div>

          <div className="sim-chat__stream">
            {!started && (
              <p className="sim-placeholder">
                Klikni <strong>„Kreni simulaciju”</strong> — klijent (AI) otvara situaciju i
                pitanje. Razgovor teče prirodno dok jedna strana ne odluči završetak, ili pritisak na
                „Završi simulaciju”.
              </p>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`sim-msg sim-msg--${msg.role === "user" ? "user" : "ai"}`}
              >
                <div className="sim-msg__meta">
                  {msg.role === "ai" ? (
                    <span className="sim-msg__av sim-msg__av--ai" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <rect x="4" y="6" width="16" height="12" rx="2" />
                        <circle cx="9" cy="11" r="1.2" fill="#fff" />
                        <circle cx="15" cy="11" r="1.2" fill="#fff" />
                        <path d="M8 16h8" stroke="#fff" strokeWidth="0.6" fill="none" />
                      </svg>
                    </span>
                  ) : (
                    <span className="sim-msg__av sim-msg__av--u" aria-hidden>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <circle cx="12" cy="8" r="3.2" />
                        <path d="M6 19c0-3.2 2.5-5 6-5s6 1.8 6 5" />
                      </svg>
                    </span>
                  )}
                  <span className="sim-msg__who">
                    {msg.role === "ai" ? "Klijent (AI)" : "Ti"}
                  </span>
                </div>
                <div className="sim-msg__bubble">
                  {msg.text}
                  {msg.time ? (
                    <div className="sim-msg__foot">
                      <time>{msg.time}</time>
                      <span className="sim-msg__read" aria-label="Pročitano">
                        ✓✓
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="sim-compose">
            <label className="visually-hidden" htmlFor="sim-input">
              Tvoj odgovor
            </label>
            <textarea
              id="sim-input"
              className="sim-input"
              rows={3}
              placeholder="Napiši kratak odgovor klijentu…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!started || Boolean(feedback) || loading}
            />
            <div className="sim-actions">
              <input ref={fileRef} type="file" className="visually-hidden" onChange={onFile} accept="*/*" />
              <button type="button" className="sim-linkbtn" onClick={onAttach} disabled={!started || Boolean(feedback)}>
                <span className="sim-linkbtn__ic" aria-hidden>
                  📎
                </span>
                Priloži fajl
              </button>
              <button
                type="button"
                className={
                  `sim-linkbtn` + (voiceListening ? " sim-linkbtn--listening" : "")
                }
                onClick={onVoice}
                disabled={!started || Boolean(feedback)}
                aria-pressed={voiceListening}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" fill="none" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M12 19v2" fill="none" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                {voiceListening ? "Zaustavi snimanje" : "Snimi glasovni odgovor"}
              </button>
              <button
                type="button"
                className="sim-send"
                onClick={onSend}
                disabled={!started || !input.trim() || Boolean(feedback) || loading}
              >
                {loading ? "Šalje…" : "Pošalji odgovor"}
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M2 21L23 12 2 3v7l7 2-7 2v7z" />
                </svg>
              </button>
            </div>
            {started && !feedback ? (
              <p className="sim-hint sim-hint--foot">
                <button type="button" className="sim-hint__end" onClick={onZavrsiSimulaciju} disabled={loading}>
                  Završi simulaciju
                </button>
                {" "}
                — uvek ocenjuje cela ćaskanja (i kad AI prvo završi, i kad klikneš ovde).
              </p>
            ) : (
              <p className="sim-hint">
                Glas se pretvara u tekst (Chrome/Edge). Ili napiši u polje.
              </p>
            )}
          </div>
        </div>

        <aside className="sim-panel">
          <div className="sim-panel__inner">
            <div className="sim-score" aria-live="polite">
              {feedback ? (
                <>
                  <div
                    className="sim-score__ring"
                    style={{
                      "--pct": Math.min(100, (feedback.score / 10) * 100),
                    }}
                  >
                    <span className="sim-score__val">
                      {Number.isInteger(feedback.score)
                        ? feedback.score
                        : feedback.score.toFixed(1)}{" "}
                      / 10
                    </span>
                  </div>
                  <p className="sim-score__label">{feedback.summary}</p>
                </>
              ) : (
                <div className="sim-score--empty">
                  <p>
                    Ocena stiže posle <strong>završetka razgovora</strong> (hvala od klijenta) ili
                    pritiskom na <strong>Završi simulaciju</strong>.
                  </p>
                </div>
              )}
            </div>

            {feedback ? (
              <>
                <section className="sim-block sim-block--good">
                  <h3 className="sim-block__h">
                    <span className="sim-block__ico">✓</span> Šta je dobro?
                  </h3>
                  <ul>
                    {feedback.good.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </section>
                <section className="sim-block sim-block--imp">
                  <h3 className="sim-block__h">
                    <span className="sim-block__ico sim-block__ico--a">A</span>{" "}
                    Šta možeš još bolje?
                  </h3>
                  <ul>
                    {feedback.improve.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </section>
                <section className="sim-block sim-block--ideal">
                  <h3 className="sim-block__h">
                    <span className="sim-block__ico sim-block__ico--bulb" aria-hidden>
                      💡
                    </span>{" "}
                    Predlog pristupa
                  </h3>
                  <p className="sim-ideal-text">{feedback.ideal}</p>
                </section>
                <div className="sim-panel__foot">
                  <Link to="/home" className="sim-next">
                    Početna
                    <span aria-hidden> →</span>
                  </Link>
                  <button type="button" className="sim-again" onClick={onNovaSimulacija}>
                    Nova simulacija
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
