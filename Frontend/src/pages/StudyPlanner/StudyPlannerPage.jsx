import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { recordFeatureTouch, syncProfileFieldFromCurrentAccount } from "../../lib/nexoraSession.js";
import "./studyPlanner.scss";

const STORAGE = "nexora_study_planner_v1";

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

/**
 * @returns {{ id: string, title: string, due: string, done: boolean }[]}
 */
function parseItems() {
  return loadItems().map((x) => ({
    id: String(x.id || crypto.randomUUID?.() || Date.now()),
    title: String(x.title || "").trim() || "Bez naslova",
    due: String(x.due || ""),
    done: Boolean(x.done),
  }));
}

function saveItems(items) {
  localStorage.setItem(STORAGE, JSON.stringify(items));
}

export default function StudyPlannerPage() {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [items, setItems] = useState(() => parseItems());

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    recordFeatureTouch("study_planner", null);
  }, []);

  const add = useCallback(() => {
    const t = title.trim();
    if (!t) return;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `id-${Date.now()}`;
    setItems((prev) => {
      const next = [{ id, title: t, due, done: false }, ...prev];
      saveItems(next);
      return next;
    });
    setTitle("");
    setDue("");
  }, [title, due]);

  const toggle = useCallback((id) => {
    setItems((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x));
      saveItems(next);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveItems(next);
      return next;
    });
  }, []);

  return (
    <div className="sp">
      <div className="sp__shell">
        <nav className="sp__nav" aria-label="Planer učenja">
          <Link to="/home" className="sp__back">
            ← Početna
          </Link>
          <div className="sp__head">
            <span className="sp__kicker">Raspored</span>
            <h1 className="sp__title">Planer učenja</h1>
          </div>
          <div style={{ width: "1px", flex: "0 0 0" }} aria-hidden />
        </nav>
        <main className="sp__main">
        <form
          className="sp__form"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <div className="sp__form-row sp__form-row--inline">
            <div className="sp__form-row" style={{ flex: 1 }}>
              <span className="sp__label" id="sp-task-label">
                Zadatak
              </span>
              <input
                className="sp__input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="npr. Ponovi digestivne enzime"
                aria-labelledby="sp-task-label"
              />
            </div>
            <div className="sp__form-row" style={{ minWidth: "10.5rem" }}>
              <span className="sp__label" id="sp-due-label">
                Rok
              </span>
              <input
                className="sp__date"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                aria-labelledby="sp-due-label"
              />
            </div>
            <button type="submit" className="sp__add">
              Dodaj
            </button>
          </div>
        </form>

        {items.length === 0 ? (
          <p className="sp__empty">
            <span className="sp__empty-icon" aria-hidden>
              📋
            </span>
            Dodaj prvi zadatak — lično je sačuvano u ovom pregledaču.
          </p>
        ) : (
          <ul className="sp__list">
            {items.map((it) => (
              <li key={it.id} className={`sp__item${it.done ? " sp__item--done" : ""}`}>
                <input
                  type="checkbox"
                  className="sp__check"
                  checked={it.done}
                  onChange={() => toggle(it.id)}
                  aria-label="Označi završeno"
                />
                <div className="sp__item-main">
                  <p className="sp__item-title">{it.title}</p>
                  {it.due ? (
                    <p className="sp__item-date">
                      {new Date(it.due + "T12:00:00").toLocaleDateString("sr-Latn-RS", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="sp__remove"
                  onClick={() => remove(it.id)}
                  aria-label="Obriši"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        </main>
      </div>
    </div>
  );
}
