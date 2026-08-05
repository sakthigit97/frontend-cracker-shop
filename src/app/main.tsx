import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "../store/auth.store";
import { AiRecommendationProvider } from "../store/aiRecommendation.store";
import AppInitializer from "../providers/AppInitializer";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppInitializer>
      <AuthProvider>
        <AiRecommendationProvider>
          <App />
        </AiRecommendationProvider>
      </AuthProvider>
    </AppInitializer>
  </React.StrictMode>
);