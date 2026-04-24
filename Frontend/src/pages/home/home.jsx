import "./home.scss";

const features = [
  {
    id: "scenario",
    rotation: "-5deg",
    emoji: "🎭",
    title: "Simulacija životnog scenarija",
    description: "Uđi u realne situacije iz tvoje oblasti i donosi odluke.",
  },
  {
    id: "notes",
    rotation: "7deg",
    emoji: "📝",
    title: "Beleške",
    description: "Pravi, uredi i organizuj beleške po temama i predmetima.",
  },
  {
    id: "lectures",
    rotation: "-3deg",
    emoji: "🎧",
    title: "Slušaj predavanja",
    description: "Pristupaj audio i video predavanjima po predmetima.",
  },
  {
    id: "flashcards",
    rotation: "6deg",
    emoji: "🃏",
    title: "Flash Cards",
    description: "Uči pojmove kroz brze kartice — idealno za ponavljanje.",
  },
];

const Home = () => {
  const field = localStorage.getItem("selectedField") || "it";

  return (
    <div className={`home home--${field}`}>
      <div className="home__bg" aria-hidden="true" />

      <main className="home__main">
        <header className="home__header">
          <div className="home__logo-wrap">
            <svg
              width="680"
              height="300"
              viewBox="0 0 680 300"
              xmlns="http://www.w3.org/2000/svg"
              style={{ background: "#0a0a0f" }}
            >
              <line x1="100" y1="60" x2="100" y2="240" stroke="#00E5C4" strokeWidth="0.5" opacity="0.15"/>
              <line x1="580" y1="60" x2="580" y2="240" stroke="#00E5C4" strokeWidth="0.5" opacity="0.15"/>
              <line x1="80" y1="80" x2="600" y2="80" stroke="#00E5C4" strokeWidth="0.5" opacity="0.08"/>
              <line x1="80" y1="220" x2="600" y2="220" stroke="#00E5C4" strokeWidth="0.5" opacity="0.08"/>

              <polyline points="100,95 100,75 120,75" fill="none" stroke="#00E5C4" strokeWidth="1.5"/>
              <polyline points="560,95 560,75 540,75" fill="none" stroke="#00E5C4" strokeWidth="1.5"/>
              <polyline points="100,205 100,225 120,225" fill="none" stroke="#00E5C4" strokeWidth="1.5"/>
              <polyline points="560,205 560,225 540,225" fill="none" stroke="#00E5C4" strokeWidth="1.5"/>

              <circle cx="100" cy="75" r="2.5" fill="#00E5C4"/>
              <circle cx="560" cy="75" r="2.5" fill="#00E5C4"/>
              <circle cx="100" cy="225" r="2.5" fill="#00E5C4"/>
              <circle cx="560" cy="225" r="2.5" fill="#00E5C4"/>

              <text
                x="340" y="178"
                fontFamily="'Courier New', Courier, monospace"
                fontSize="80"
                fontWeight="500"
                letterSpacing="8"
                fill="#ffffff"
                textAnchor="middle"
              >NEX<tspan fill="#00E5C4">O</tspan>RA</text>

              <line x1="100" y1="205" x2="196" y2="205" stroke="#555" strokeWidth="0.5"/>
              <line x1="484" y1="205" x2="580" y2="205" stroke="#555" strokeWidth="0.5"/>

              <text
                x="340" y="209"
                fontFamily="'Courier New', Courier, monospace"
                fontSize="11"
                fontWeight="400"
                letterSpacing="5"
                fill="#00E5C4"
                textAnchor="middle"
              >NEXT GEN LEARNING</text>

              <line x1="300" y1="222" x2="380" y2="222" stroke="#00E5C4" strokeWidth="0.5" opacity="0.5"/>
              <line x1="326" y1="228" x2="354" y2="228" stroke="#00E5C4" strokeWidth="0.5" opacity="0.25"/>
            </svg>
          </div>

          <h1 className="home__heading">Šta ćeš da radiš danas?</h1>
        </header>

        <div className="home__grid">
          {features.map((f) => (
            <article
              key={f.id}
              className="home-card"
              style={{ "--rot": f.rotation }}
            >
              <h2 className="home-card__title">{f.title}</h2>
              <div className="home-card__emoji" aria-hidden="true">{f.emoji}</div>
              <p className="home-card__desc">{f.description}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
