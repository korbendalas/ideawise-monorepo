import React from "react";
import { createRoot } from "react-dom/client";
import { UploadApp } from "./UploadApp";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <UploadApp />
  </React.StrictMode>
);
