import { BrowserRouter, Routes, Route } from "react-router-dom";
import Intro from "./pages/Intro/intro.jsx";
import Home from "./pages/home/home.jsx";
import Login from "./pages/Login/login.jsx";
import Simulacija from "./pages/Simulacija/simulacija.jsx";
import Notes from "./pages/Notes/notes.jsx";
import StudyPlannerPage from "./pages/StudyPlanner/StudyPlannerPage.jsx";
import FieldChatPage from "./pages/FieldChat/FieldChatPage.jsx";
import AiQuizPage from "./pages/AiQuiz/AiQuizPage.jsx";
import SourcesAiPage from "./pages/SourcesAi/SourcesAiPage.jsx";
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
            path="/predavanja/*"
            element={
              <RequireAuth>
                <LecturesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/lectures/*"
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
          <Route
            path="/study-planner"
            element={
              <RequireAuth>
                <StudyPlannerPage />
              </RequireAuth>
            }
          />
          <Route
            path="/field-chat"
            element={
              <RequireAuth>
                <FieldChatPage />
              </RequireAuth>
            }
          />
          <Route
            path="/ai-quiz"
            element={
              <RequireAuth>
                <AiQuizPage />
              </RequireAuth>
            }
          />
          <Route
            path="/izvori-ai"
            element={
              <RequireAuth>
                <SourcesAiPage />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
