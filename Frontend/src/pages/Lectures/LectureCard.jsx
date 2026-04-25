import { getLecturePlayUrl } from "../../api/lecturesApi.js";

/**
 * @param {{ lecture: object, rot: string, onPusti: (l: object) => void }} props
 */
export default function LectureCard({ lecture, rot, onPusti }) {
  const isVideo = lecture.type === "video";
  const playUrl = getLecturePlayUrl(lecture);
  const disabled = !playUrl;

  return (
    <article
      className="lecture-card home-card home-card--lectures"
      style={{ "--rot": rot }}
    >
      <div className="lecture-card__visual home-card__visual" aria-hidden="true">
        {isVideo ? (
          <svg
            className="lecture-card__type-ic"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="56"
            height="56"
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
          </svg>
        ) : (
          <svg
            className="lecture-card__type-ic"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="56"
            height="56"
          >
            <path d="M3 18v-3a4 4 0 014-4h0a4 4 0 014 4v3" />
            <path d="M16 7a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M18 14v4" />
            <path d="M16 16h4" />
          </svg>
        )}
      </div>
      <div className="lecture-card__body home-card__body">
        <h2 className="home-card__title">{lecture.title}</h2>
        <p className="home-card__desc">{lecture.description || "—"}</p>
        <p className="lecture-card__duration">Trajanje: {lecture.duration}</p>
        <button
          type="button"
          className="home-card__btn"
          disabled={disabled}
          onClick={() => onPusti(lecture)}
        >
          Pusti →
        </button>
      </div>
    </article>
  );
}
