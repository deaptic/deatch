import { events } from "../bindings.ts";
import { unlistenAll } from "./listen.ts";
import { addToast } from "../stores/toasts.ts";
import { setUser } from "../stores/users.ts";
import { setDeviceCode, setWaiting } from "../stores/auth.ts";
import { errorMessage } from "../utils/error.ts";
import * as users from "../services/users.ts";
import { t } from "../i18n/index.ts";

export function start(): () => void {
  return unlistenAll([
    events.authSucceeded.listen((e) => {
      setWaiting(false);
      setDeviceCode(null);
      setUser(e.payload);
      users.set([e.payload]);
      addToast(t("AUTH_CONNECTED"), "success");
    }),
    events.authFailed.listen((e) => {
      setWaiting(false);
      setDeviceCode(null);
      addToast(errorMessage(e.payload), "error");
    }),
    events.sessionEnded.listen(() => {
      setUser(null);
      addToast(t("AUTH_SIGNED_OUT"), "error");
    }),
  ]);
}
