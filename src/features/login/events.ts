import { listenApp, unlistenAll } from "../../lib/events/listen.ts";
import { addToast } from "../../kit/toasts.ts";
import { setUser } from "../../lib/stores/users.ts";
import { setDeviceCode, setWaiting } from "./auth.ts";
import { errorMessage } from "../../lib/utils/error.ts";
import * as users from "../../lib/services/users.ts";
import { t } from "../../shared/i18n/index.ts";

export function start(): () => void {
  return unlistenAll([
    listenApp("authSucceeded", (user) => {
      setWaiting(false);
      setDeviceCode(null);
      setUser(user);
      users.set([user]);
      addToast(t("LOGIN_CONNECTED_TOAST"), "success");
    }),
    listenApp("authFailed", (error) => {
      setWaiting(false);
      setDeviceCode(null);
      addToast(errorMessage(error), "error");
    }),
    listenApp("sessionEnded", () => {
      setUser(null);
      addToast(t("LOGIN_SIGNED_OUT_ERROR"), "error");
    }),
  ]);
}
