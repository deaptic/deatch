/* @refresh reload */
document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
import { render } from "solid-js/web";
import App from "./App.tsx";
import * as preferences from "./features/preferences/index.ts";
import * as storage from "./platform/storage.ts";

storage.prune();
preferences.load();
const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");
const dispose = render(() => <App />, root);
window.addEventListener("pagehide", dispose, { once: true });
