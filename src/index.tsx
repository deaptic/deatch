/* @refresh reload */
document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
import { render } from "solid-js/web";
import App from "./App";
import Toaster from "./components/toaster/Toaster";
import { toasts, removeToast } from "./state/toasts";

render(
  () => (
    <>
      <App />
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </>
  ),
  document.getElementById("root") as HTMLElement,
);
