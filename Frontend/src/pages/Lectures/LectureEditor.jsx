import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createLecture,
  deleteLecture,
  fetchLectureById,
  updateLecture,
} from "../../api/lecturesApi.js";
import { getAccountField } from "../../lib/nexoraSession.js";

export default function LectureEditor() {
  const { id: paramId } = useParams();
  const isNew = !paramId;
  const idNum = isNew ? null : parseInt(String(paramId), 10);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("15 min");
  const [type, setType] = useState("video");
  const [fileUrl, setFileUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const fieldSubj = () => getAccountField() || "it";

  const load = useCallback(async () => {
    if (isNew || !idNum || Number.isNaN(idNum)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const L = await fetchLectureById(idNum);
      if (!L || L.error) {
        setErr("Predavanje nije pronađeno.");
        return;
      }
      setTitle(L.title || "");
      setDescription(L.description || "");
      setDuration(L.duration || "15 min");
      setType(L.type === "audio" ? "audio" : "video");
      setFileUrl(L.file_url || "");
      setVideoUrl(L.video_url || "");
    } catch (e) {
      setErr(e?.message || "Učitavanje nije uspelo.");
    } finally {
      setLoading(false);
    }
  }, [isNew, idNum]);

  useEffect(() => {
    load();
  }, [load]);

  const buildBody = () => {
    const subject = fieldSubj();
    if (type === "audio") {
      return {
        title: (title || "").trim() || "Bez naslova",
        description: description || "",
        subject,
        duration: (duration || "").trim() || "0 min",
        type: "audio",
        file_url: (fileUrl || "").trim() || null,
        video_url: null,
      };
    }
    return {
      title: (title || "").trim() || "Bez naslova",
      description: description || "",
      subject,
      duration: (duration || "").trim() || "0 min",
      type: "video",
      file_url: null,
      video_url: (videoUrl || "").trim() || null,
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    const body = buildBody();
    if (body.type === "audio" && !body.file_url) {
      setErr("Unesi URL audio fajla (mp3 itd.).");
      setSaving(false);
      return;
    }
    if (body.type === "video" && !body.video_url) {
      setErr("Unesi URL video fajla.");
      setSaving(false);
      return;
    }
    try {
      if (isNew) {
        await createLecture(body);
        navigate("/predavanja");
        return;
      }
      await updateLecture(idNum, body);
      navigate("/predavanja");
    } catch (e) {
      setErr(e?.message || "Čuvanje nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      navigate("/predavanja");
      return;
    }
    if (!window.confirm("Obrisati ovo predavanje?")) return;
    setSaving(true);
    try {
      await deleteLecture(idNum);
      navigate("/predavanja");
    } catch (e) {
      setErr(e?.message || "Brisanje nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="lec-inner">
        <p className="lec-muted">Učitavanje…</p>
      </div>
    );
  }

  return (
    <div className="lec-inner lec-editor">
      <h1 className="lec-editor__h1">
        {isNew ? "Novo predavanje" : "Uredi predavanje"}
      </h1>
      {err ? <p className="lec-err">{err}</p> : null}

      <label className="lec-field">
        <span className="lec-field__l">Naslov</span>
        <input
          className="lec-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Naziv lekcije"
        />
      </label>
      <label className="lec-field">
        <span className="lec-field__l">Opis</span>
        <textarea
          className="lec-textarea"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kratki opis sadržaja"
        />
      </label>
      <label className="lec-field">
        <span className="lec-field__l">Trajanje (za prikaz)</span>
        <input
          className="lec-input"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="npr. 12 min"
        />
      </label>
      <label className="lec-field">
        <span className="lec-field__l">Tip</span>
        <select
          className="lec-input lec-input--sel"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
      </label>
      {type === "audio" ? (
        <label className="lec-field">
          <span className="lec-field__l">URL audio fajla</span>
          <input
            className="lec-input"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://... .mp3"
          />
        </label>
      ) : (
        <label className="lec-field">
          <span className="lec-field__l">URL videa (YouTube ili direktan .mp4 / .webm)</span>
          <input
            className="lec-input"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… ili https://…/file.mp4"
          />
        </label>
      )}

      <p className="lec-hint">
        Predmet je uvek onaj koji si izabrao/la na uvodu — ovde se ne bira odvojeno.
      </p>

      <div className="lec-editor__ft">
        <button
          type="button"
          className="lec-btn lec-btn--pri"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Čuvam…" : "Sačuvaj"}
        </button>
        <button
          type="button"
          className="lec-btn lec-btn--del"
          onClick={handleDelete}
          disabled={saving}
        >
          {isNew ? "Odustani" : "Obriši"}
        </button>
        <Link to="/predavanja" className="lec-backlink">
          ← Na listu
        </Link>
      </div>
    </div>
  );
}
