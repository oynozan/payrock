import { Toaster } from "react-hot-toast";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./pages/App";

import "./styles/main.scss";

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <Toaster position="bottom-right" />
        <App />
    </BrowserRouter>
);
