import { useCallback, useEffect, useRef, useState } from "react";
import { getLecturePlayUrl, postLectureSummarize } from "../../api/lecturesApi.js";
import { getYoutubeEmbedUrl } from "../../lib/youtubeEmbed.js";

export default function LecturePlayer({ lecture, open, onClose }) {
  const mediaRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryErr, setSummaryErr] = useState(null);

  const url = lecture ? getLecturePlayUrl(lecture) : null;
  const isVideo = lecture?.type === "video";
  const youtubeEmbed = isVideo && url ? getYoutubeEmbedUrl(url) : null;
  const useYoutubeIframe = Boolean(youtubeEmbed);

  useEffect(() => {
    setSummary("");
    setSummaryErr(null);
    setPlaying(false);
    const el = mediaRef.current;
    if (!el || !open || useYoutubeIframe) return;
    el.pause();
    el.currentTime = 0;
    if ("load" in el && typeof el.load === "function") {
      el.load();
    }
  }, [lecture?.id, open, url, useYoutubeIframe]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || useYoutubeIframe) return;
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
  }, [lecture?.id, isVideo, open, useYoutubeIframe]);

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
          !isVideo ? (
            <audio ref={mediaRef} className="lecture-player__audio" src={url} controls />
          ) : useYoutubeIframe ? (
            <iframe
              key={`${lecture.id}-${youtubeEmbed}`}
              className="lecture-player__media lecture-player__media--yt"
              title={lecture.title || "YouTube video"}
              src={`${youtubeEmbed}${youtubeEmbed.includes("?") ? "&" : "?"}rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <video
              ref={mediaRef}
              className="lecture-player__media"
              src={url}
              playsInline
              controls
            />
          )
        ) : (
          <p className="lecture-player__no-url">Nema URL medija za ovo predavanje.</p>
        )}

        {useYoutubeIframe ? (
          <p className="lecture-player__yt-hint">
            YouTube: pusti / pauziraj pomoću ugrađenog plejera.
          </p>
        ) : null}

        <div className="lecture-player__controls">
          <button
            type="button"
            className="lecture-player__btn lecture-player__btn--primary"
            onClick={togglePlay}
            disabled={!url || useYoutubeIframe}
          >
            {playing ? "Pauziraj" : "Pusti"}
          </button>
          <button
            type="button"
            className="lecture-player__btn"
            onClick={restart}
            disabled={!url || useYoutubeIframe}
          >
            Od početka
          </button>
          <button type="button" className="lecture-player__btn" onClick={onClose}>
            Zatvori
          </button>
        </div>

        <div className="lecture-player__ai">
          {isVideo ? (
            <p className="lecture-player__summary-note">
              Sažetak koristi naslov, opis i link videa (YouTube ili mp4). Transkript snimka se ne šalje modelu.
            </p>
          ) : null}
          <button
            type="button"
            className="lecture-player__summarize"
            onClick={handleSummarize}
            disabled={summaryBusy || !lecture?.id}
          >
            {summaryBusy ? "…" : isVideo ? "Sažmi video" : "Sažmi predavanje"}
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
