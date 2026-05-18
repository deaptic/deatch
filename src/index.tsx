/* @refresh reload */
document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
import { render } from "solid-js/web";
import App from "./App";
import Toaster from "./components/toaster/Toaster";
import { toasts, removeToast } from "./state/toasts";
import { checkForUpdates } from "./services/updater";
import { setPendingUpdate } from "./state/updater";

render(
  () => (
    <>
      <App />
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </>
  ),
  document.getElementById("root") as HTMLElement,
);

(async () => {
  const update = await checkForUpdates();
  if (update) setPendingUpdate(update);
})();
