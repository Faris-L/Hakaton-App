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
import { getAccountField, getInputPlaceholder } from "../../lib/nexoraSession.js";

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
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState([emptyCard()]);
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genCount, setGenCount] = useState(5);
  const [field, setField] = useState("it");
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

  useEffect(() => {
    setField(getAccountField() || "it");
  }, []);

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
          subject: getAccountField() || "it",
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
        subject: getAccountField() || "it",
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

      <div className="fc-editor__blurb" role="region" aria-label="Uputstvo za uređivač">
        <p className="fc-editor__blurb-p">
          <strong>Flash kartica</strong> = par „pitanje / termin” (levo) i „odgovor / značenje” (desno). Set
          se veže za <strong>tvoj smer</strong> s uvoda. Kada sačuvaš, na listi setova klikni{" "}
          <strong>Vežbaj</strong> da prođeš kroz kartice.
        </p>
        <ul className="fc-editor__blurb-ul">
          <li>
            Možeš ručno uneti redove ispod, ili otvoriti <strong>Generiši kartice</strong> — AI predloži
            tekst, ti proveriš i dodaš šta treba, pa <strong>Sačuvaj set</strong>.
          </li>
          <li>
            Samo redovi gde su i pitanje i odgovor popunjeni idu u set pri čuvanju.
          </li>
        </ul>
      </div>

      <div className="fc-editor__form">
        <label className="fc-field">
          <span className="fc-field__l">Naslov</span>
          <input
            className="fc-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={getInputPlaceholder(field, "flashTitle")}
          />
        </label>
        <p className="fc-field-hint">
          Predmet nije odvojen izbor: uvek je <strong>smer koji si izabrao/la na uvodu</strong> (isti kao na
          početnoj strani).
        </p>
        <label className="fc-field">
          <span className="fc-field__l">Opis (opciono)</span>
          <textarea
            className="fc-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Npr. za ispit u junu, ponavljanje 4. modula…"
          />
        </label>
      </div>

      <h3 className="fc-editor__h3">Kartice (pitanje → odgovor)</h3>
      <p className="fc-editor__cards-lead">
        Svaki red = jedna kartica. Levo napiši šta želiš da pitaš (ili šta gledaš), desno rešenje. Težina
        pomaže tebi u pregledu; nije obavezna za čuvanje.
      </p>
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
            <p className="fc-modal__p">
              Upiši <strong>šta učiš</strong> (temu ili oblast) i koliko parova želiš. Model predloži
              pitanja i kratke odgovore na srpskom i <strong>ubaci ih u tabelu ispod</strong> — obavezno
              proveri tekst, pa klikni <strong>Sačuvaj set</strong>. Ovo nije zasebna beleška niti drugi
              alat, samo pomoć pri pravljenju kartica.
            </p>
            {genErr ? <p className="fc-err">{genErr}</p> : null}
            <label className="fc-field">
              <span className="fc-field__l">Tema</span>
              <input
                className="fc-input"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder={getInputPlaceholder(field, "flashGenTopic")}
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
