import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  getAccountField,
  getDisplayName,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
  FIELD_NAMES,
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
  const field = getAccountField() || "it";
  const fieldLabel = FIELD_NAMES[field] || "Informatika";

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

      <div className="notes__hero">
        <h1 className="notes__page-h1">Beleške</h1>
        <p className="notes__kicker">Smer · {fieldLabel}</p>
        <h2 className="notes__headline">Tvoje ideje, skice i pitanja na jednom mestu</h2>
        <p className="notes__lead">
          Beleške su vezane za tvoj izabrani smer. Svaka ima naslov i slobodan tekst — za ispit, konspket
          iz predavanja ili pitanja za proveru. Sačuvano je na nalog, možeš da se vraćaš i menjaš kad god.
        </p>
      </div>

      <main className="notes__main">
        {err ? <p className="notes__err">{err}</p> : null}
        {loading ? (
          <div className="notes__skeleton" aria-busy="true" aria-label="Učitavanje beleški">
            <div className="notes__skeleton-card" />
            <div className="notes__skeleton-card" />
            <div className="notes__skeleton-card" />
            <div className="notes__skeleton-card" />
          </div>
        ) : notes.length === 0 ? (
          <div className="notes__empty">
            <div className="notes__empty-ic" aria-hidden="true">
              📒
            </div>
            <h3 className="notes__empty-title">Započni prvu belešku</h3>
            <p className="notes__empty-text">
              Nemaš još nijedan zapis. Klikni gore <strong>+ Nova beleška</strong> i unesi naslov (npr.{" "}
              <em>Rečnik pojmova</em> ili <em>Skripta — 3. čas</em>), pa sadržaj. Posle uvek možeš da
              dopuniš.
            </p>
            <button
              type="button"
              className="notes__empty-cta"
              onClick={() => navigate("new")}
            >
              Kreiraj belešku
            </button>
          </div>
        ) : (
          <>
            <p className="notes__count" role="status">
              <span className="notes__count-num">{notes.length}</span>
              {notes.length === 1 ? " beleška" : " beleške"}
              <span className="notes__count-dot" aria-hidden />
              <span className="notes__count-field">{fieldLabel}</span>
            </p>
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
          </>
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
  const [justSaved, setJustSaved] = useState(false);
  const saveBtnRef = useRef(null);
  const justSavedTimerRef = useRef(0);

  useEffect(() => {
    return () => {
      if (justSavedTimerRef.current) {
        window.clearTimeout(justSavedTimerRef.current);
      }
    };
  }, []);

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
    setJustSaved(false);
    const body = {
      title: (title || "").trim() || "Bez naslova",
      content: content || "",
      subject: getAccountField() || "it",
    };
    try {
      if (isNew) {
        const n = await createNote(body);
        if (n?.id) {
          navigate("/notes", { replace: true });
        } else {
          setErr("Odgovor servera nema ID beleške.");
        }
      } else {
        await updateNote(idNum, body);
        setJustSaved(true);
        if (justSavedTimerRef.current) {
          window.clearTimeout(justSavedTimerRef.current);
        }
        justSavedTimerRef.current = window.setTimeout(() => {
          setJustSaved(false);
          justSavedTimerRef.current = 0;
        }, 2500);
      }
    } catch (e) {
      setErr(e?.message || "Čuvanje nije uspelo.");
    } finally {
      setSaving(false);
      saveBtnRef.current?.blur();
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
        <nav className="notes__nav" aria-label="Beleška">
          <Link to="/notes" className="notes__back">
            ← Nazad na listu
          </Link>
          <span className="notes__nav-end-sp" aria-hidden="true" />
        </nav>
        <main className="notes__main">
          <h1 className="notes__page-h1">Beleška</h1>
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
      <>
        <nav className="notes__nav" aria-label="Uređivač">
          <Link to="/notes" className="notes__back">
            ← Nazad na listu
          </Link>
          <span className="notes__nav-end-sp" aria-hidden="true" />
        </nav>
        <main className="notes__main notes__main--editor">
          <h1 className="notes__page-h1">Uredi belešku</h1>
          <p className="notes__loading">Učitavanje…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <nav className="notes__nav" aria-label="Uređivač">
        <Link to="/notes" className="notes__back">
          ← Nazad na listu
        </Link>
        <span className="notes__nav-end-sp" aria-hidden="true" />
      </nav>
      <main className="notes__main notes__main--editor">
        <h1 className="notes__page-h1">
          {isNew ? "Nova beleška" : "Uredi belešku"}
        </h1>
        {err ? <p className="notes__err">{err}</p> : null}
        <div className="notes-editor">
          <div className="notes-editor__top">
            <p className="notes-editor__badge">{FIELD_NAMES[getAccountField() || "it"] || "Smer"}</p>
            <h2 className="notes-editor__h2">Sadržaj beleške</h2>
            <p className="notes-editor__intro">
              Naslov nije obavezan u smislu forme, ali ti pomaže u listi. Sadržaj može biti dugačak ili
              kratak. Dugme ispod pita AI da sredi ili proširi tekst na osnovu onoga što već piše u polju.
            </p>
          </div>
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
              placeholder="Kratko — kako da prepoznaš listu (npr. Fiziologija — srce)"
            />
          </div>
          <p className="notes-editor__hint">Predmet je uvek smer s uvoda — nije moguća promena ovde.</p>
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
              placeholder="Napiši šta učiš, iskopiraj odlomak iz knjige, napiši pitanja za ispit, šemu…"
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
            <span className="notes-editor__save-wrap">
              <button
                type="button"
                ref={saveBtnRef}
                className="notes-editor__save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Čuvam…" : "Sačuvaj"}
              </button>
              {!isNew && justSaved && !saving ? (
                <span className="notes-editor__saved" role="status">
                  Sačuvano
                </span>
              ) : null}
            </span>
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
  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
  }, []);

  useEffect(() => {
    recordFeatureTouch("notes", null);
  }, []);

  return (
    <div className="notes">
      <Routes>
        <Route index element={<NotesListView />} />
        <Route path=":id" element={<NoteEditorView />} />
      </Routes>
    </div>
  );
}
