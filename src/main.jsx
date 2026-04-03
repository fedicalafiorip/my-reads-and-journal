import React from "react";
import ReactDOM from "react-dom/client";
import "./storage.js"; // Initialize window.storage before App loads
import "./index.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
