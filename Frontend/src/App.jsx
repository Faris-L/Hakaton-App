import { BrowserRouter, Routes, Route } from "react-router-dom";
import Intro from "./pages/Intro/intro.jsx";
import Home from "./pages/home/home.jsx";
import Simulacija from "./pages/Simulacija/simulacija.jsx";
import Profil from "./pages/Profil/profil.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/home" element={<Home />} />
          <Route path="/simulacija" element={<Simulacija />} />
          <Route path="/profil" element={<Profil />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
