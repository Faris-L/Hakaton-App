import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addFlashcardsToSet,
  createFlashcardSet,
  deleteFlashcard,
  deleteFlashcardSet,
  fetchFlashcardSet,
  generateFlashcards,
  updateFlashcard,
  updateFlashcardSet,
} from "../../api/flashcardsApi.js";
import { getAccountField } from "../../lib/nexoraSession.js";

const SUBJECTS = [
  { id: "medicine", label: "Medicina" },
  { id: "psychology", label: "Psihologija" },
  { id: "economy", label: "Ekonomija" },
  { id: "it", label: "Informatika" },
];

const DIFFS = [
  { id: "easy", label: "Lako" },
  { id: "medium", label: "Srednje" },
  { id: "hard", label: "Teško" },
];

let tempKey = 0;
function newKey() {
  tempKey += 1;
  return `t-${Date.now()}-${tempKey}`;
}

function emptyCard() {
  return {
    _key: newKey(),
    id: null,
    question: "",
    answer: "",
    difficulty: "medium",
  };
}

export default function FlashcardEditor() {
  const { setId } = useParams();
  const isNew = !setId;
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(() => getAccountField() || "it");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState([emptyCard()]);
  const [deletedIds, setDeletedIds] = useState(/** @type {Set<number>} */ (new Set()));
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genCount, setGenCount] = useState(5);
  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState(null);

  const load = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const s = await fetchFlashcardSet(Number(setId));
      if (!s) {
        setErr("Set nije pronađen.");
        return;
      }
      setTitle(s.title || "");
      setSubject(s.subject || "it");
      setDescription(s.description || "");
      const list = Array.isArray(s.cards) && s.cards.length > 0
        ? s.cards.map((c) => ({
            _key: `s-${c.id}`,
            id: c.id,
            question: c.question || "",
            answer: c.answer || "",
            difficulty: c.difficulty || "medium",
          }))
        : [emptyCard()];
      setCards(list);
      setDeletedIds(new Set());
    } catch (e) {
      setErr(e?.message || "Učitavanje nije uspelo.");
    } finally {
      setLoading(false);
    }
  }, [isNew, setId]);

  useEffect(() => {
    load();
  }, [load]);

  const addRow = () => {
    setCards((c) => [...c, emptyCard()]);
  };

  const removeRow = (row) => {
    if (row.id) {
      setDeletedIds((d) => new Set(d).add(row.id));
    }
    setCards((c) => c.filter((x) => x._key !== row._key));
  };

  const updateRow = (row, patch) => {
    setCards((c) => c.map((x) => (x._key === row._key ? { ...x, ...patch } : x)));
  };

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    const clean = cards.filter(
      (c) => c.question.trim() && c.answer.trim()
    );
    try {
      if (isNew) {
        await createFlashcardSet({
          title: title.trim() || "Bez naslova",
          subject,
          description: description || "",
          cards: clean.map((c) => ({
            question: c.question.trim(),
            answer: c.answer.trim(),
            difficulty: c.difficulty,
          })),
        });
        navigate("/flashcards");
        return;
      }
      const sid = Number(setId);
      await updateFlashcardSet(sid, {
        title: title.trim() || "Bez naslova",
        subject,
        description: description || "",
      });
      for (const id of deletedIds) {
        await deleteFlashcard(id);
      }
      for (const c of clean) {
        if (c.id) {
          await updateFlashcard(c.id, {
            question: c.question.trim(),
            answer: c.answer.trim(),
            difficulty: c.difficulty,
          });
        }
      }
      const newCards = clean.filter((c) => !c.id);
      if (newCards.length) {
        await addFlashcardsToSet(
          sid,
          newCards.map((c) => ({
            question: c.question.trim(),
            answer: c.answer.trim(),
            difficulty: c.difficulty,
          }))
        );
      }
      navigate("/flashcards");
    } catch (e) {
      setErr(e?.message || "Čuvanje nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSet = async () => {
    if (isNew) {
      navigate("/flashcards");
      return;
    }
    if (!window.confirm("Obrisati ceo set i sve kartice?")) return;
    setSaving(true);
    try {
      await deleteFlashcardSet(Number(setId));
      navigate("/flashcards");
    } catch (e) {
      setErr(e?.message || "Brisanje nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    const t = genTopic.trim();
    if (t.length < 2) {
      setGenErr("Unesi temu.");
      return;
    }
    setGenBusy(true);
    setGenErr(null);
    try {
      const { cards: gen } = await generateFlashcards(t, Math.min(40, Math.max(1, genCount)));
      if (Array.isArray(gen) && gen.length) {
        setCards((prev) => {
          const extra = gen.map((c) => ({
            _key: newKey(),
            id: null,
            question: c.question,
            answer: c.answer,
            difficulty: c.difficulty || "medium",
          }));
          const base = prev.filter((p) => p.question.trim() || p.answer.trim());
          return [...base, ...extra];
        });
        setGenOpen(false);
        setGenTopic("");
      }
    } catch (e) {
      console.error(e);
      setGenErr("Generisanje nije uspelo.");
    } finally {
      setGenBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="fc-inner">
        <p className="fc-muted">Učitavanje…</p>
      </div>
    );
  }

  return (
    <div className="fc-inner fc-editor">
      <div className="fc-editor__head">
        <h1 className="fc-editor__h1">{isNew ? "Novi set" : "Uredi set"}</h1>
        <div className="fc-editor__head-actions">
          <button
            type="button"
            className="fc-btn fc-btn--ai"
            onClick={() => {
              setGenOpen(true);
              setGenErr(null);
            }}
          >
            Generiši kartice
          </button>
        </div>
      </div>

      {err ? <p className="fc-err">{err}</p> : null}

      <div className="fc-editor__form">
        <label className="fc-field">
          <span className="fc-field__l">Naslov</span>
          <input
            className="fc-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="npr. SQL osnove"
          />
        </label>
        <label className="fc-field">
          <span className="fc-field__l">Predmet</span>
          <select
            className="fc-input fc-input--select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="fc-field">
          <span className="fc-field__l">Opis (opciono)</span>
          <textarea
            className="fc-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Kratka napomena o setu"
          />
        </label>
      </div>

      <h3 className="fc-editor__h3">Kartice</h3>
      <div className="fc-card-rows">
        {cards.map((row) => (
          <div key={row._key} className="fc-card-row">
            <div className="fc-card-row__grid">
              <textarea
                className="fc-textarea"
                rows={2}
                placeholder="Pitanje"
                value={row.question}
                onChange={(e) => updateRow(row, { question: e.target.value })}
              />
              <textarea
                className="fc-textarea"
                rows={2}
                placeholder="Odgovor"
                value={row.answer}
                onChange={(e) => updateRow(row, { answer: e.target.value })}
              />
              <select
                className="fc-input fc-input--select"
                value={row.difficulty}
                onChange={(e) => updateRow(row, { difficulty: e.target.value })}
              >
                {DIFFS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="fc-icon-del"
              onClick={() => removeRow(row)}
              aria-label="Ukloni karticu"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="fc-btn fc-btn--add" onClick={addRow}>
        + Dodatak kartice
      </button>

      <div className="fc-editor__footer">
        <button
          type="button"
          className="fc-btn fc-btn--pri"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Čuvam…" : "Sačuvaj set"}
        </button>
        <button
          type="button"
          className="fc-btn fc-btn--del"
          onClick={handleDeleteSet}
          disabled={saving}
        >
          {isNew ? "Odustani" : "Obriši set"}
        </button>
        <Link to="/flashcards" className="fc-linkback">
          ← Na listu
        </Link>
      </div>

      {genOpen ? (
        <div
          className="fc-modal-bg"
          role="dialog"
          aria-modal="true"
          aria-label="Generisanje"
          onClick={(e) => e.target === e.currentTarget && setGenOpen(false)}
        >
          <div className="fc-modal">
            <h3 className="fc-modal__h">Generiši kartice (AI)</h3>
            <p className="fc-modal__p">Unesi temu i broj; kartice doda u editor (nije automatska beleška).</p>
            {genErr ? <p className="fc-err">{genErr}</p> : null}
            <label className="fc-field">
              <span className="fc-field__l">Tema</span>
              <input
                className="fc-input"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="npr. Neuron, sinapsa, akcioni potencijal"
              />
            </label>
            <label className="fc-field">
              <span className="fc-field__l">Broj kartica (1–40)</span>
              <input
                className="fc-input"
                type="number"
                min={1}
                max={40}
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value) || 5)}
              />
            </label>
            <div className="fc-modal__btns">
              <button
                type="button"
                className="fc-btn fc-btn--pri"
                onClick={handleGenerate}
                disabled={genBusy}
              >
                {genBusy ? "…" : "Generiši"}
              </button>
              <button
                type="button"
                className="fc-btn fc-btn--ghost"
                onClick={() => setGenOpen(false)}
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
