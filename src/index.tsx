/* @refresh reload */
document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
import { render } from "solid-js/web";
import App from "./App";
import Toaster from "./components/Toaster";
import { toasts, dismiss } from "./notifications";

render(
  () => (
    <>
      <App />
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </>
  ),
  document.getElementById("root") as HTMLElement,
);
