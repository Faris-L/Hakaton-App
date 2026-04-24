import { useNavigate } from "react-router-dom";
import "./intro.scss";

const fields = [
  {
    id: "medicine",
    title: "Medicina",
    shortText: "Uči kroz kliničke primere i jasne skripte.",
    description:
      "Idealno za studente medicine koji žele brže razumevanje pojmova, simptoma, dijagnoza i terapijskih principa.",
    themeClass: "theme-medicine",
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
    id: "economy",
    title: "Ekonomija",
    shortText: "Razumi tržište, finansije i odluke.",
    description:
      "Pomaže kod učenja ekonomskih pojmova, analiza, tržišta, menadžmenta i poslovnih modela.",
    themeClass: "theme-economy",
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

const BODY_THEME_CLASSES = [
  "theme-medicine",
  "theme-psychology",
  "theme-economy",
  "theme-it",
];

const Intro = () => {
  const navigate = useNavigate();

  const handleSelect = (field) => {
    localStorage.setItem("selectedField", field.id);
    localStorage.setItem("hasSelectedOption", "true");
    document.body.classList.remove(...BODY_THEME_CLASSES);
    document.body.classList.add(field.themeClass);
    navigate("/home");
  };

  return (
    <main className="intro">
      <div className="intro__inner">
        <header className="intro__header">
          <h1 className="intro__title">Izaberi smer</h1>
          <p className="intro__subtitle">
            Pređi kursorom preko kartice da vidiš više, zatim odaberi smer.
          </p>
        </header>
        <div className="intro__grid">
          {fields.map((field) => (
            <article
              key={field.id}
              className={`intro-card intro-card--${field.id}`}
            >
              <h2 className="intro-card__title">{field.title}</h2>
              <p className="intro-card__short">{field.shortText}</p>
              <div className="intro-card__reveal">
                <p className="intro-card__description">{field.description}</p>
                <button
                  type="button"
                  className="intro-card__action"
                  onClick={() => handleSelect(field)}
                >
                  Odaberi
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Intro;
