import { Link, useNavigate } from "react-router-dom";
import {
  getDisplayName,
  getAccount,
  getAccountField,
  getFeatureAvg10,
  getOverallAvg10,
  avgToPercent,
  FIELD_NAMES,
  logoutSession,
  resetAllNexoraData,
} from "../../lib/nexoraSession.js";
import "./profil.scss";

const ROWS = [
  { label: "Simulacija scenarija", key: "simulation" },
  { label: "Beleške", key: "notes" },
  { label: "Predavanja", key: "lectures" },
  { label: "Flash cards", key: "flashcards" },
];

export default function Profil() {
  const navigate = useNavigate();
  const acc = getAccount();
  const field = getAccountField() || localStorage.getItem("selectedField") || "it";
  const name = getDisplayName();
  const overall = getOverallAvg10();

  const onLogout = () => {
    logoutSession();
    navigate("/", { replace: true });
  };

  const onFullReset = () => {
    if (
      window.confirm(
        "Ovo briše nalog, ocene i izbor smera. Bićeš vraćen na uvod. Nastaviti?"
      )
    ) {
      resetAllNexoraData();
      document.body.classList.remove(
        "theme-medicine",
        "theme-psychology",
        "theme-economy",
        "theme-it"
      );
      navigate("/", { replace: true });
    }
  };

  return (
    <main className="profil">
      <header className="profil__bar">
        <Link to="/home" className="profil__back">
          ← Početna
        </Link>
        <h1 className="profil__h1">Profil</h1>
      </header>

      <div className="profil__card">
        <p className="profil__meta">
          <strong>{name || "Nalog"}</strong>
          {acc?.createdAt ? (
            <span className="profil__since">
              {" "}
              · nalog od {new Date(acc.createdAt).toLocaleDateString("sr-RS")}
            </span>
          ) : null}
        </p>
        <p className="profil__field">
          Smer: <strong>{FIELD_NAMES[field] || "Informatika"}</strong> (veza ime ↔ smer se pamti
          po nalogu)
        </p>
        <p className="profil__avg">
          Ukupan prosek AI ocena:{" "}
          <strong>
            {overall != null ? `${overall.toFixed(2)} / 10 (${avgToPercent(overall)}%)` : "—"}
          </strong>
        </p>

        <h2 className="profil__h2">Po alatima</h2>
        <ul className="profil__list">
          {ROWS.map((r) => {
            const a = getFeatureAvg10(r.key);
            return (
              <li key={r.key}>
                <span>{r.label}</span>
                <span className="profil__score">
                  {a != null ? `${a.toFixed(2)} / 10` : "—"}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="profil__note">
          Ocene iz simulacije dolaze sa servera; ostali alati beleže interakciju i prosek po
          nalogu. Isti progres može se nastaviti samo ulogavanjem sa istim imenom i smerom. Posle
          odjave na uvodu možeš drugi nalog; stari ostaje zapamćen.
        </p>

        <div className="profil__actions">
          <button type="button" className="profil__btn" onClick={onLogout}>
            Odjavi se
          </button>
          <button type="button" className="profil__btn profil__btn--danger" onClick={onFullReset}>
            Resetuj sve (uvod + nalog)
          </button>
        </div>
      </div>
    </main>
  );
}
