/* @refresh reload */
document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
import { render } from "solid-js/web";
import App from "./App.tsx";
import * as preferences from "./lib/services/preferences.ts";

preferences.load();
render(() => <App />, document.getElementById("root") as HTMLElement);
