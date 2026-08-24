import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShareApp } from "./share/ShareApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<StrictMode><ShareApp /></StrictMode>);
