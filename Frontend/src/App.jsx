import { BrowserRouter, Routes, Route } from "react-router-dom";
import Intro from "./pages/Intro/intro.jsx";
import Home from "./pages/home/home.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
