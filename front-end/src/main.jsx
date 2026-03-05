import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// TODO: adicionar providers globais aqui conforme necessidade (ex: Context, QueryClient)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
