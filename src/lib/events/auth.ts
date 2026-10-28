import { listenApp, unlistenAll } from "./listen.ts";
import { addToast } from "../stores/toasts.ts";
import { setUser } from "../stores/users.ts";
import { setDeviceCode, setWaiting } from "../stores/auth.ts";
import { errorMessage } from "../utils/error.ts";
import * as users from "../services/users.ts";
import { t } from "../i18n/index.ts";

export function start(): () => void {
  return unlistenAll([
    listenApp("authSucceeded", (user) => {
      setWaiting(false);
      setDeviceCode(null);
      setUser(user);
      users.set([user]);
      addToast(t("AUTH_CONNECTED"), "success");
    }),
    listenApp("authFailed", (error) => {
      setWaiting(false);
      setDeviceCode(null);
      addToast(errorMessage(error), "error");
    }),
    listenApp("sessionEnded", () => {
      setUser(null);
      addToast(t("AUTH_SIGNED_OUT"), "error");
    }),
  ]);
}
