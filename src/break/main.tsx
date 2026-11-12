import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/global.css";
import { BreakScreen } from "./BreakScreen";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BreakScreen />
  </StrictMode>,
);
