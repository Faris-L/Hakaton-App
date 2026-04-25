import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDisplayName,
  recordFeatureTouch,
  syncProfileFieldFromCurrentAccount,
} from "../../lib/nexoraSession.js";
import { fetchLecturesList } from "../../api/lecturesApi.js";
import LectureCard from "./LectureCard.jsx";
import LecturePlayer from "./LecturePlayer.jsx";
import "../home/home.scss";
import "./lectures.scss";

const SUBJECTS = [
  { id: "all", label: "Svi predmeti" },
  { id: "medicine", label: "Medicina" },
  { id: "psychology", label: "Psihologija" },
  { id: "economy", label: "Ekonomija" },
  { id: "it", label: "Informatika" },
];

const ROTS = ["-2deg", "1.5deg", "-1.2deg", "2deg", "-1.5deg", "0.8deg", "-0.5deg", "1.2deg"];

export default function LecturesPage() {
  const [field, setField] = useState(
    () => localStorage.getItem("selectedField") || "it"
  );
  const [filter, setFilter] = useState(
    () => localStorage.getItem("selectedField") || "it"
  );
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [active, setActive] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const me = getDisplayName();

  useEffect(() => {
    syncProfileFieldFromCurrentAccount();
    setField(localStorage.getItem("selectedField") || "it");
  }, []);

  useEffect(() => {
    recordFeatureTouch("lectures", null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchLecturesList(filter);
      setLectures(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Učitavanje predavanja nije uspelo.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

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
    <div className={`lectures lectures--${field}`}>
      <div className="lectures__bg" aria-hidden="true" />

      <header className="lectures__nav">
        <Link to="/home" className="lectures__back">
          ← Početna
        </Link>
        {me ? <span className="lectures__user">{me}</span> : <span className="lectures__user-sp" />}
      </header>

      <div className="lectures__hero">
        <h1 className="lectures__h1">Slušaj predavanja</h1>
        <p className="lectures__lead">
          Audio i video zapisi podeljeni po predmetu. Pusti snimak, pauziraj koliko treba, ili zatraži kratak
          sažetak u playeru.
        </p>
        <div className="lectures__toolbar">
          <label className="visually-hidden" htmlFor="lectures-filter">
            Filtar predmeta
          </label>
          <select
            id="lectures-filter"
            className="lectures__filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <main className="lectures__main">
        {err ? <p className="lectures__err">{err}</p> : null}
        {loading ? (
          <p className="lectures__loading">Učitavanje…</p>
        ) : lectures.length === 0 ? (
          <p className="lectures__empty">
            Nema predavanja za ovaj izbor. Probaj &quot;Svi predmeti&quot; ili poveži backend i pokreni seed.
          </p>
        ) : (
          <div className="lectures__grid">
            {lectures.map((lec, i) => (
              <LectureCard
                key={lec.id}
                lecture={lec}
                rot={ROTS[i % ROTS.length]}
                onPusti={openPlayer}
              />
            ))}
          </div>
        )}
      </main>

      <LecturePlayer lecture={active} open={playerOpen} onClose={closePlayer} />
    </div>
  );
}
