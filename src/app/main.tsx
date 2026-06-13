import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "../store/auth.store";
import App from "./App";
import "./index.css";
import { AiRecommendationProvider } from "../store/aiRecommendation.store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AiRecommendationProvider>
        <App />
      </AiRecommendationProvider>
    </AuthProvider>
  </React.StrictMode>
);