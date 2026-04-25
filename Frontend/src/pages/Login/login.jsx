import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  isFieldCommitted,
  tryLoginOrRegister,
  isSessionActive,
  FIELD_NAMES,
  clearFieldSelectionForIntro,
} from "../../lib/nexoraSession.js";
import "./login.scss";

function fieldLabel() {
  const id = localStorage.getItem("selectedField");
  return (id && FIELD_NAMES[id]) || "—";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/home";

  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const selectedField = localStorage.getItem("selectedField");
  const fieldTitle = fieldLabel();

  useEffect(() => {
    if (!isFieldCommitted()) {
      navigate("/", { replace: true });
      return;
    }
    if (isSessionActive()) {
      const dest = from && from !== "/login" && from !== "/" ? from : "/home";
      navigate(dest, { replace: true });
    }
  }, [navigate, from]);

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    const r = tryLoginOrRegister(name, pass);
    if (r.ok) {
      const dest = from && from !== "/login" && from !== "/" ? from : "/home";
      navigate(dest, { replace: true });
    } else {
      setErr(r.error || "Pokušaj ponovo.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1 className="login-page__title">Nexora</h1>
        <p className="login-page__lead">
          Prijava ili novi nalog vezan za smer <strong>{fieldTitle}</strong>. Isto korisničko ime
          koje si već iskoristio/la na drugom smeru ne možeš ovde; aplikacija pamti smer tog naloga.
        </p>

        {isFieldCommitted() && selectedField ? (
          <p className="login-page__field-note">
            Registruješ se za <strong>{fieldTitle}</strong> — taj smer i ime ostaju povezani (u ovom
            pregledaču). Posle odjave na uvodu možeš ući kao neko drugi.
          </p>
        ) : null}

        <form className="login-form" onSubmit={onSubmit} autoComplete="on">
          <label className="login-form__label" htmlFor="login-name">
            Korisničko ime
          </label>
          <input
            id="login-name"
            name="username"
            className="login-form__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            autoComplete="username"
          />

          <label className="login-form__label" htmlFor="login-pass">
            Lozinka
          </label>
          <input
            id="login-pass"
            name="password"
            className="login-form__input"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            minLength={4}
            autoComplete="current-password"
            placeholder="••••••••"
          />

          {err ? (
            <p className="login-form__err" role="alert">
              {err}
            </p>
          ) : null}

          <button type="submit" className="login-form__submit">
            Prijavi se ili kreiraj nalog
          </button>
        </form>

        <p className="login-page__back">
          <Link
            to="/"
            onClick={() => {
              clearFieldSelectionForIntro();
            }}
          >
            ← Uvod (drugi smer)
          </Link>
        </p>
      </div>
    </div>
  );
}
