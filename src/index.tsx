/* @refresh reload */
document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
import { render } from "solid-js/web";
import App from "./App";
import Toaster from "./components/toaster/Toaster";
import { toasts, removeToast, addToast } from "./state/toasts";
import { checkForUpdates, installUpdate } from "./services/updater";

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
  if (!update) return;
  addToast(`Update v${update.version} available`, "info", "Downloading and installing…");
  try {
    await installUpdate(update);
  } catch (e) {
    console.error("update install failed", e);
    addToast("Update failed", "error", String(e));
  }
})();
