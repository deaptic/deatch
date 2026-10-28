/* @refresh reload */
document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
import { render } from "solid-js/web";
import App from "./App.tsx";
import * as preferences from "./lib/services/preferences.ts";
import * as storage from "./lib/utils/storage.ts";

storage.prune();
preferences.load();
const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");
render(() => <App />, root);
