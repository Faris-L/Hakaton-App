import { useState, useEffect, useCallback } from "react";
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

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [address, setAddress] = useState("");
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

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setErr("");

      if (mode === "register") {
        const r = tryLoginOrRegister(name, pass, {
          register: true,
          firstName,
          lastName,
          faculty,
          address,
        });
        if (r.ok) {
          const dest = from && from !== "/login" && from !== "/" ? from : "/home";
          navigate(dest, { replace: true });
        } else {
          setErr(r.error || "Pokušaj ponovo.");
        }
        return;
      }

      const r = tryLoginOrRegister(name, pass);
      if (r.ok) {
        const dest = from && from !== "/login" && from !== "/" ? from : "/home";
        navigate(dest, { replace: true });
      } else {
        setErr(r.error || "Pokušaj ponovo.");
      }
    },
    [mode, name, pass, firstName, lastName, faculty, address, from, navigate]
  );

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1 className="login-page__title">Nexora</h1>
        <p className="login-page__lead">
          Prijavi se sa postojećim nalogom ili <strong>napravi novi nalog</strong> — podaci o tebi
          (ime, prezime, fakultet, adresa) vide se u <strong>Profilu</strong> nakon ulogovanja.
        </p>

        {isFieldCommitted() && selectedField ? (
          <p className="login-page__field-note">
            Nalog vži za smer <strong>{fieldTitle}</strong>. Korisničko ime je po smeru jedinstveno u
            ovom pregledaču.
          </p>
        ) : null}

        <div className="login-page__tabs" role="tablist" aria-label="Vrsta pristupa">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`login-page__tab ${mode === "login" ? "login-page__tab--active" : ""}`}
            onClick={() => {
              setMode("login");
              setErr("");
            }}
          >
            Prijavljivanje
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`login-page__tab ${mode === "register" ? "login-page__tab--active" : ""}`}
            onClick={() => {
              setMode("register");
              setErr("");
            }}
          >
            Kreiraj nalog
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit} autoComplete="on">
          <div className="login-form__section">
            <h2 className="login-form__h2">Pristup nalogu</h2>
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
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder="••••••••"
            />
          </div>

          {mode === "register" ? (
            <div className="login-form__section login-form__section--profile">
              <h2 className="login-form__h2">Podaci o tebi (vide se u profilu)</h2>
              <div className="login-form__row2">
                <div>
                  <label className="login-form__label" htmlFor="reg-fn">
                    Ime
                  </label>
                  <input
                    id="reg-fn"
                    name="firstName"
                    className="login-form__input"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={mode === "register"}
                    minLength={2}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="login-form__label" htmlFor="reg-ln">
                    Prezime
                  </label>
                  <input
                    id="reg-ln"
                    name="lastName"
                    className="login-form__input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={mode === "register"}
                    minLength={2}
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <label className="login-form__label" htmlFor="reg-fac">
                Fakultet / ustanova
              </label>
              <input
                id="reg-fac"
                name="faculty"
                className="login-form__input"
                type="text"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                required={mode === "register"}
                minLength={2}
                autoComplete="organization"
                placeholder="npr. Fakultet organizacionih nauka, ETF…"
              />
              <label className="login-form__label" htmlFor="reg-addr">
                Adresa (ulica, grad)
              </label>
              <input
                id="reg-addr"
                name="address"
                className="login-form__input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required={mode === "register"}
                minLength={4}
                autoComplete="street-address"
                placeholder="npr. Bulevar 1, Beograd"
              />
            </div>
          ) : null}

          {err ? (
            <p className="login-form__err" role="alert">
              {err}
            </p>
          ) : null}

          <button type="submit" className="login-form__submit">
            {mode === "register" ? "Kreiraj nalog i uđi" : "Prijavi se"}
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
