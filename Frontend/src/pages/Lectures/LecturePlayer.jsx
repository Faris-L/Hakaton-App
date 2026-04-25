import { useCallback, useEffect, useRef, useState } from "react";
import { getLecturePlayUrl, postLectureSummarize } from "../../api/lecturesApi.js";

export default function LecturePlayer({ lecture, open, onClose }) {
  const mediaRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryErr, setSummaryErr] = useState(null);

  const url = lecture ? getLecturePlayUrl(lecture) : null;
  const isVideo = lecture?.type === "video";

  useEffect(() => {
    setSummary("");
    setSummaryErr(null);
    setPlaying(false);
    const el = mediaRef.current;
    if (!el || !open) return;
    el.pause();
    el.currentTime = 0;
    if ("load" in el && typeof el.load === "function") {
      el.load();
    }
  }, [lecture?.id, open, url]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [lecture?.id, isVideo, open]);

  const togglePlay = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  const restart = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  }, []);

  const handleSummarize = async () => {
    if (!lecture?.id) return;
    setSummaryBusy(true);
    setSummaryErr(null);
    try {
      const data = await postLectureSummarize(lecture.id);
      setSummary(typeof data.summary === "string" ? data.summary : "");
    } catch (e) {
      console.error("[Lectures] sažetak:", e);
      setSummaryErr("Sažetak trenutno nije dostupan.");
    } finally {
      setSummaryBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !lecture) return null;

  return (
    <div
      className="lecture-player-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lecture-player-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lecture-player">
        <div className="lecture-player__head">
          <h2 id="lecture-player-title" className="lecture-player__title">
            {lecture.title}
          </h2>
          <button
            type="button"
            className="lecture-player__close"
            onClick={onClose}
            aria-label="Zatvori player"
          >
            ×
          </button>
        </div>

        {url ? (
          isVideo ? (
            <video
              ref={mediaRef}
              className="lecture-player__media"
              src={url}
              playsInline
              controls
            />
          ) : (
            <audio ref={mediaRef} className="lecture-player__audio" src={url} controls />
          )
        ) : (
          <p className="lecture-player__no-url">Nema URL medija za ovo predavanje.</p>
        )}

        <div className="lecture-player__controls">
          <button
            type="button"
            className="lecture-player__btn lecture-player__btn--primary"
            onClick={togglePlay}
            disabled={!url}
          >
            {playing ? "Pauziraj" : "Pusti"}
          </button>
          <button
            type="button"
            className="lecture-player__btn"
            onClick={restart}
            disabled={!url}
          >
            Od početka
          </button>
          <button type="button" className="lecture-player__btn" onClick={onClose}>
            Zatvori
          </button>
        </div>

        <div className="lecture-player__ai">
          <button
            type="button"
            className="lecture-player__summarize"
            onClick={handleSummarize}
            disabled={summaryBusy || !lecture?.id}
          >
            {summaryBusy ? "…" : "Sažmi predavanje"}
          </button>
          {summaryErr ? (
            <p className="lecture-player__summary-err" role="alert">
              {summaryErr}
            </p>
          ) : null}
          {summary ? (
            <p className="lecture-player__summary">{summary}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
