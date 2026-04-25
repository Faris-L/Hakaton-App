import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { postAiAsk } from "../../api/client.js";
import {
  FIELD_NAMES,
  getAccountField,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
} from "../../lib/nexoraSession.js";
import "./fieldChat.scss";

const SYSTEM = `Ti si strpljiv asistent za učenje. Odgovaraj jasno i kratko na srpskom (latinica), stručno u okviru smera koji ti je dat u prvoj reči. Ako pitanje nije iz tog smera, napiši kratko da pitanje nije u oblasti, pa daj umereno opšti savet. Ne koristi naslove sa #; budi prijateljski.`;

export default function FieldChatPage() {
  const [field, setField] = useState("it");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [messages, setMessages] = useState(
    () =>
      /** @type {{ role: "user" | "assistant"; text: string }[]} */ ([])
  );
  const endRef = useRef(null);

  const resetChat = useCallback(() => {
    setMessages([]);
    setErr(null);
    setInput("");
  }, []);

  const canReset =
    messages.length > 0 || Boolean(err) || Boolean(input.trim());

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(getAccountField() || "it");
    recordFeatureTouch("field_chat", null);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    setErr(null);
    setMessages((m) => [...m, { role: "user", text: t }]);
    setLoading(true);
    try {
      const label = FIELD_NAMES[field] || "Informatika";
      const { reply } = await postAiAsk({
        system: `${SYSTEM} Trenutni smer: ${label}.`,
        message: t,
      });
      setMessages((m) => [...m, { role: "assistant", text: reply || "—" }]);
    } catch (e) {
      setErr(e?.message || "Zahtev nije uspeo.");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Dogodila se greška. Proveri da li je API dostupan (OPENAI) i pokušaj ponovo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [field, input, loading]);

  const fieldLabel = FIELD_NAMES[field] || "Informatika";

  return (
    <div className="fc">
      <div className="fc__shell">
        <header className="fc__header" aria-label="Chat za smer">
          <nav className="fc__nav" aria-label="Kretanje">
            <Link to="/home" className="fc__back">
              ← Početna
            </Link>
            <h1 className="fc__title">Chat</h1>
            <button
              type="button"
              className="fc__reset"
              onClick={resetChat}
              disabled={loading || !canReset}
              title="Obriši celu prepisku i počni iznova"
            >
              Počni iznova
            </button>
          </nav>
          <span className="fc__kicker">Smer fokus</span>
          <p className="fc__sub">
            Aktivna oblast: <span className="fc__sub-strong">{fieldLabel}</span> · izaberi u profilu
          </p>
        </header>

        <div className="fc__thread" role="log" aria-live="polite">
          {messages.length === 0 && !loading ? (
            <p className="fc__empty">
              <span className="fc__empty-icon" aria-hidden>
                💬
              </span>
              Pitaj o definicijama, vežbama, objašnjenjima i primerima u okviru svog smera.
            </p>
          ) : null}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`fc__msg fc__msg--${m.role === "user" ? "user" : "ai"}`}
            >
              <span className="fc__msg-meta">
                {m.role === "user" ? "Ti" : "Nexora"}
              </span>
              {m.text}
            </div>
          ))}
          {loading ? (
            <div className="fc__msg fc__msg--ai fc__msg--typing" aria-busy>
              <span className="fc__dot" />
              <span className="fc__dot" />
              <span className="fc__dot" />
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {err ? <p className="fc__err">{err}</p> : null}

        <form
          className="fc__form"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            className="fc__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napiši pitanje…"
            disabled={loading}
            autoComplete="off"
            aria-label="Poruka"
          />
          <button type="submit" className="fc__send" disabled={loading || !input.trim()}>
            Pošalji
          </button>
        </form>
      </div>
    </div>
  );
}
