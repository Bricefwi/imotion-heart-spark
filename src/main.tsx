import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initSsoCookieBridge } from "@/lib/sso-cookie-bridge";

// Démarre le SSO cookie bridge (no-op hors *.imotion-conseils.fr).
void initSsoCookieBridge();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
