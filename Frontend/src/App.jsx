import { BrowserRouter, Routes, Route } from "react-router-dom";
import Intro from "./pages/Intro/intro.jsx";
import "./App.css";

function HomePlaceholder() {
  return <main>Home</main>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/home" element={<HomePlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
