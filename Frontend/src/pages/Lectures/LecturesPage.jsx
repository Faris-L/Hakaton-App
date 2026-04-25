import { useCallback, useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import {
  getDisplayName,
  getAccountField,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
} from "../../lib/nexoraSession.js";
import { fetchLecturesList } from "../../api/lecturesApi.js";
import LectureCard from "./LectureCard.jsx";
import LecturePlayer from "./LecturePlayer.jsx";
import LectureEditor from "./LectureEditor.jsx";
import "../home/home.scss";
import "./lectures.scss";

const ROTS = ["-2deg", "1.5deg", "-1.2deg", "2deg", "-1.5deg", "0.8deg", "-0.5deg", "1.2deg"];

function LecturesListView() {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [active, setActive] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const me = getDisplayName();
  const navigate = useNavigate();

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const subj = getAccountField() || "it";
    try {
      const data = await fetchLecturesList(subj);
      setLectures(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Učitavanje predavanja nije uspelo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openPlayer = (lecture) => {
    setActive(lecture);
    setPlayerOpen(true);
  };

  const closePlayer = () => {
    setPlayerOpen(false);
    setActive(null);
  };

  return (
    <>
      <header className="lectures__nav">
        <Link to="/home" className="lectures__back">
          ← Početna
        </Link>
        {me ? <span className="lectures__user">{me}</span> : <span className="lectures__user-sp" />}
      </header>

      <div className="lectures__hero">
        <h1 className="lectures__h1">Slušaj predavanja</h1>
        <p className="lectures__lead">
          Audio i video snimci za tvoj smer. Pusti zapis, pauziraj koliko treba, u playeru i kratak
          sažetak, ili dodaj svoje povezivanjem URL-a.
        </p>
        <div className="lectures__toolbar">
          <button
            type="button"
            className="lectures__new"
            onClick={() => navigate("new")}
          >
            + Novo predavanje
          </button>
        </div>
      </div>

      <main className="lectures__main">
        {err ? <p className="lectures__err">{err}</p> : null}
        {loading ? (
          <p className="lectures__loading">Učitavanje…</p>
        ) : lectures.length === 0 ? (
          <p className="lectures__empty">
            Nema snimaka za tvoj smer. Dodaj prvo klikom na „+ Novo predavanje” ili poveži backend
            (seed).
          </p>
        ) : (
          <div className="lectures__grid">
            {lectures.map((lec, i) => (
              <LectureCard
                key={lec.id}
                lecture={lec}
                rot={ROTS[i % ROTS.length]}
                onPusti={openPlayer}
                onEdit={() => navigate(`${lec.id}/edit`)}
              />
            ))}
          </div>
        )}
      </main>

      <LecturePlayer lecture={active} open={playerOpen} onClose={closePlayer} />
    </>
  );
}

export default function LecturesPage() {
  const [field, setField] = useState(
    () => localStorage.getItem("selectedField") || "it"
  );

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(localStorage.getItem("selectedField") || "it");
  }, []);

  useEffect(() => {
    recordFeatureTouch("lectures", null);
  }, []);

  return (
    <div className={`lectures lectures--${field}`}>
      <div className="lectures__bg" aria-hidden="true" />
      <div className="lectures__routes">
        <Routes>
          <Route index element={<LecturesListView />} />
          <Route path="new" element={<LectureEditor />} />
          <Route path=":id/edit" element={<LectureEditor />} />
        </Routes>
      </div>
    </div>
  );
}
