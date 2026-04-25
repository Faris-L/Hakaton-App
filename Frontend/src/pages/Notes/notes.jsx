import { useCallback, useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  getAccountField,
  getDisplayName,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
} from "../../lib/nexoraSession.js";
import {
  createNote,
  deleteNote,
  fetchNotesList,
  postNoteAssist,
  updateNote,
} from "../../api/client.js";
import "./notes.scss";

const ROTS = ["-2deg", "1.5deg", "-1deg", "2.2deg", "-1.5deg", "0.5deg"];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("sr-Latn-RS", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function NotesListView() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();
  const me = getDisplayName();

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const subj = getAccountField() || "it";
    try {
      const data = await fetchNotesList(subj);
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Ne mogu učitati beleške.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <nav className="notes__nav" aria-label="Beleške">
        <Link to="/home" className="notes__back">
          ← Početna
        </Link>
        <h1 className="notes__title">Beleške</h1>
        <div className="notes__toolbar">
          {me ? <span className="notes__user">{me}</span> : null}
          <button
            type="button"
            className="notes__new"
            onClick={() => navigate("new")}
          >
            + Nova beleška
          </button>
        </div>
      </nav>

      <main className="notes__main">
        {err ? <p className="notes__err">{err}</p> : null}
        {loading ? (
          <p className="notes__loading">Učitavanje…</p>
        ) : notes.length === 0 ? (
          <p className="notes__empty">
            Još nema beleški. Klik na „+ Nova beleška” da kreneš.
          </p>
        ) : (
          <div className="notes__grid">
            {notes.map((n, i) => (
              <button
                key={n.id}
                type="button"
                className="notes__card"
                style={{ "--rot": ROTS[i % ROTS.length] }}
                onClick={() => navigate(String(n.id))}
              >
                <div className="notes__card-visual" aria-hidden="true">
                  📝
                </div>
                <div className="notes__card-body">
                  <h2 className="notes__card-title">
                    {n.title?.trim() || "Bez naslova"}
                  </h2>
                  <p className="notes__card-meta">
                    {formatDate(n.created_at)}
                  </p>
                  <p className="notes__card-excerpt">
                    {(n.content || "").trim() || "…"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function NoteEditorView() {
  const { id: paramId } = useParams();
  const isNew = paramId === "new";
  const idNum = isNew || !paramId ? null : parseInt(String(paramId), 10);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
  }, []);

  useEffect(() => {
    if (isNew) {
      setTitle("");
      setContent("");
      setLoading(false);
      return;
    }
    if (idNum == null || Number.isNaN(idNum)) {
      setLoadErr("Nevažeća beleška.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const list = await fetchNotesList(getAccountField() || "it");
        const n = (Array.isArray(list) ? list : []).find(
          (x) => x.id === idNum
        );
        if (cancelled) return;
        if (!n) {
          setLoadErr("Beleška nije pronađena.");
        } else {
          setTitle(n.title || "");
          setContent(n.content || "");
        }
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e?.message || "Učitavanje nije uspelo.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, idNum]);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    const body = {
      title: (title || "").trim() || "Bez naslova",
      content: content || "",
      subject: getAccountField() || "it",
    };
    try {
      if (isNew) {
        const n = await createNote(body);
        if (n?.id) {
          navigate(`/notes/${n.id}`, { replace: true });
        }
      } else {
        await updateNote(idNum, body);
      }
    } catch (e) {
      setErr(e?.message || "Čuvanje nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      navigate("/notes");
      return;
    }
    if (!window.confirm("Obrisati ovu belešku?")) return;
    setSaving(true);
    setErr(null);
    try {
      await deleteNote(idNum);
      navigate("/notes");
    } catch (e) {
      setErr(e?.message || "Brisanje nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleAiHelp = async () => {
    const t = (content || title || "").trim();
    if (!t) {
      setErr("Upiši bar temu ili početak teksta.");
      return;
    }
    setAiBusy(true);
    setErr(null);
    try {
      const { text } = await postNoteAssist(t);
      if (typeof text === "string" && text.trim()) {
        setContent(text.trim());
      }
    } catch (e) {
      console.error("[Notes assist]", e);
      setErr("AI pomoć trenutno nije dostupna.");
    } finally {
      setAiBusy(false);
    }
  };

  if (loadErr) {
    return (
      <>
        <nav className="notes__nav">
          <Link to="/notes" className="notes__back">
            ← Nazad na listu
          </Link>
          <h1 className="notes__title">Beleška</h1>
        </nav>
        <main className="notes__main">
          <p className="notes__err">{loadErr}</p>
          <Link to="/notes" className="notes__back">
            ← Lista beleški
          </Link>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <main className="notes__main">
        <p className="notes__loading">Učitavanje…</p>
      </main>
    );
  }

  return (
    <>
      <nav className="notes__nav" aria-label="Uređivač">
        <Link to="/notes" className="notes__back">
          ← Nazad na listu
        </Link>
        <h1 className="notes__title">
          {isNew ? "Nova beleška" : "Uredi belešku"}
        </h1>
        <span style={{ minWidth: "5rem" }} />
      </nav>
      <main className="notes__main">
        {err ? <p className="notes__err">{err}</p> : null}
        <div className="notes-editor">
          <div className="notes-editor__row">
            <span className="notes-editor__label" id="note-title-label">
              Naslov
            </span>
            <input
              id="note-title"
              className="notes-editor__input"
              aria-labelledby="note-title-label"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Naslov beleške"
            />
          </div>
          <p className="notes-editor__hint">Predmet: onaj izabran na uvodu (nije moguća promena ovde).</p>
          <div className="notes-editor__row">
            <span className="notes-editor__label" id="note-content-label">
              Sadržaj
            </span>
            <textarea
              id="note-content"
              className="notes-editor__textarea"
              aria-labelledby="note-content-label"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tvoj tekst, skica ili pitanje…"
            />
          </div>
          <div className="notes-editor__actions">
            <button
              type="button"
              className="notes-editor__ai"
              onClick={handleAiHelp}
              disabled={saving || aiBusy}
            >
              {aiBusy ? "…" : "Pomozi mi da napišem"}
            </button>
            <button
              type="button"
              className="notes-editor__save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Čuvam…" : "Sačuvaj"}
            </button>
            <button
              type="button"
              className="notes-editor__delete"
              onClick={handleDelete}
              disabled={saving}
            >
              Obriši
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default function Notes() {
  const [field, setField] = useState(
    () => localStorage.getItem("selectedField") || "it"
  );

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(localStorage.getItem("selectedField") || "it");
  }, []);

  useEffect(() => {
    recordFeatureTouch("notes", null);
  }, []);

  return (
    <div className={`notes notes--${field}`}>
      <div className="notes__bg" aria-hidden="true" />
      <Routes>
        <Route index element={<NotesListView />} />
        <Route path=":id" element={<NoteEditorView />} />
      </Routes>
    </div>
  );
}
