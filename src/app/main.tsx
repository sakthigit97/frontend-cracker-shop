import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "../store/auth.store";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);