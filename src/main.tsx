import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";

if (import.meta.env.DEV) {
  void import("./dev/previewSync").then(({ startPreviewSync }) => startPreviewSync());
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
