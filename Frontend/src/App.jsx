import { BrowserRouter, Routes, Route } from "react-router-dom";
import Intro from "./pages/Intro/intro.jsx";
import Home from "./pages/home/home.jsx";
import Login from "./pages/Login/login.jsx";
import Simulacija from "./pages/Simulacija/simulacija.jsx";
import Notes from "./pages/Notes/notes.jsx";
import LecturesPage from "./pages/Lectures/LecturesPage.jsx";
import FlashcardsPage from "./pages/Flashcards/FlashcardsPage.jsx";
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
            path="/notes/*"
            element={
              <RequireAuth>
                <Notes />
              </RequireAuth>
            }
          />
          <Route
            path="/predavanja"
            element={
              <RequireAuth>
                <LecturesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/lectures"
            element={
              <RequireAuth>
                <LecturesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/flashcards/*"
            element={
              <RequireAuth>
                <FlashcardsPage />
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
