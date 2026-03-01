import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ThreeDInteractive from "./ThreeDInteractive"; // Your current 3D interactive App
import Home from "./components/Home/home";
import InfoPage from "./components/Info/info";
import "./styles.css"
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/3dinteractive" element={<ThreeDInteractive />} />
        <Route path="/info" element={<InfoPage />} />
      </Routes>
    </Router>
  );
};

export default App;
