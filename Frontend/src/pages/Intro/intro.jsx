import { useNavigate } from "react-router-dom";
import medicinaImg from "../../assets/medicina.png";
import ekonomijaImg from "../../assets/ekonomija.png";
import psihologijaImg from "../../assets/psihologija.png";
import informatikaImg from "../../assets/informatika.png";
import nexoraLogo from "../../assets/nexora-logo.svg";
import "./intro.scss";

const FIELDS = [
  {
    id: "medicine",
    title: "Medicina",
    shortText: "Uči kroz kliničke primere i jasne skripte.",
    description:
      "Idealno za studente medicine koji žele brže razumevanje pojmova, simptoma, dijagnoza i terapijskih principa.",
    themeClass: "theme-medicine",
  },
  {
    id: "economy",
    title: "Ekonomija",
    shortText: "Razumi tržište, finansije i poslovne odluke.",
    description:
      "Pomaže kod učenja ekonomskih pojmova, analiza, tržišta, menadžmenta i poslovnih modela.",
    themeClass: "theme-economy",
  },
  {
    id: "psychology",
    title: "Psihologija",
    shortText: "Poveži teoriju, ponašanje i praksu.",
    description:
      "Pogodno za učenje psiholoških pravaca, teorija ličnosti, emocija, kognicije i praktičnih primera.",
    themeClass: "theme-psychology",
  },
  {
    id: "it",
    title: "Informatika",
    shortText: "Uči programiranje i tehnologiju kroz primere.",
    description:
      "Namenjeno studentima informatike za razumevanje koda, algoritama, baza podataka i softverskih sistema.",
    themeClass: "theme-it",
  },
];

const BOARD_ORDER = [
  { corner: "tl", fieldId: "medicine" },
  { corner: "tr", fieldId: "economy" },
  { corner: "bl", fieldId: "psychology" },
  { corner: "br", fieldId: "it" },
];

const BODY_THEMES = [
  "theme-medicine",
  "theme-psychology",
  "theme-economy",
  "theme-it",
];

const byId = Object.fromEntries(FIELDS.map((f) => [f.id, f]));

const FIELD_IMAGES = {
  medicine: medicinaImg,
  economy: ekonomijaImg,
  psychology: psihologijaImg,
  it: informatikaImg,
};

function FieldIcon({ id }) {
  const p = { "aria-hidden": true, className: "field-icon" };
  switch (id) {
    case "medicine":
      return (
        <svg {...p} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case "economy":
      return (
        <svg {...p} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3v18h2V3H3zm3 0v12h2V3H6zm3 0v6h2V3H9zm3 0v9h2V3h-2zm3 0v4h2V3h-2zM3 22h18v1H3v-1z" />
        </svg>
      );
    case "psychology":
      return (
        <svg {...p} viewBox="0 0 24 24" fill="currentColor">
          <text
            x="12"
            y="17"
            textAnchor="middle"
            className="field-icon__psi"
          >
            Ψ
          </text>
        </svg>
      );
    case "it":
      return (
        <svg
          {...p}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <rect x="2" y="4" width="20" height="12" rx="1.2" />
          <line x1="3" y1="20" x2="5" y2="20" strokeLinecap="round" />
          <line x1="19" y1="20" x2="21" y2="20" strokeLinecap="round" />
          <path
            d="M8 10.5L6.2 12.2 8 14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 10.5L17.8 12.2 16 14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="10.5"
            y1="14.2"
            x2="13.5"
            y2="9.8"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function Intro() {
  const navigate = useNavigate();

  const selectField = (field) => {
    localStorage.setItem("selectedField", field.id);
    localStorage.setItem("hasSelectedOption", "true");
    document.body.classList.remove(...BODY_THEMES);
    document.body.classList.add(field.themeClass);
    navigate("/home");
  };

  return (
    <main className="intro">
      <div className="intro__frame">
        <div className="board">
          <aside className="board__hub" aria-label="Nexora">
            <img
              className="board-hub__logo"
              src={nexoraLogo}
              width={400}
              height={400}
              alt="Nexora"
            />
          </aside>

          <div className="board__quadrants" role="list">
            {BOARD_ORDER.map(({ corner, fieldId }) => {
              const field = byId[fieldId];
              const titleId = `intro-title-${field.id}`;
              return (
                <article
                  key={field.id}
                  className={`quad quad--${corner} quad--${field.id}`}
                  role="listitem"
                  tabIndex={0}
                  aria-labelledby={titleId}
                >
                  <div
                    className="quad__bg"
                    style={{
                      backgroundImage: `url(${FIELD_IMAGES[field.id]})`,
                    }}
                    aria-hidden
                    data-field={field.id}
                  />
                  <div className="quad__overlay" aria-hidden />
                  <div className="quad__panel">
                    <span className="quad__emblem" aria-hidden>
                      <FieldIcon id={field.id} />
                    </span>
                    <h2 className="quad__title" id={titleId}>
                      {field.title}
                    </h2>
                    <p className="quad__lede">{field.shortText}</p>
                    <button
                      type="button"
                      className="quad__cta"
                      onClick={() => selectField(field)}
                    >
                      Odaberi
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
