import { BrowserRouter, Routes, Route } from "react-router-dom";
import Intro from "./pages/Intro/intro.jsx";
import Home from "./pages/home/home.jsx";
import Login from "./pages/Login/login.jsx";
import Simulacija from "./pages/Simulacija/simulacija.jsx";
import Profil from "./pages/Profil/profil.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/simulacija"
            element={
              <RequireAuth>
                <Simulacija />
              </RequireAuth>
            }
          />
          <Route
            path="/profil"
            element={
              <RequireAuth>
                <Profil />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
