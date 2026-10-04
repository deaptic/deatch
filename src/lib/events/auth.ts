import { events } from "../bindings.ts";
import { unlistenAll } from "./listen.ts";
import { addToast } from "../stores/toasts.ts";
import { setUser } from "../stores/users.ts";
import { setDeviceCode, setWaiting } from "../stores/auth.ts";
import { errorMessage } from "../utils/error.ts";
import * as users from "../services/users.ts";

export function start(): () => void {
  return unlistenAll([
    events.authSucceeded.listen((e) => {
      setWaiting(false);
      setDeviceCode(null);
      setUser(e.payload);
      users.remember([e.payload]);
      addToast("Connected to Twitch!", "success");
    }),
    events.authFailed.listen((e) => {
      setWaiting(false);
      setDeviceCode(null);
      addToast(errorMessage(e.payload), "error");
    }),
  ]);
}
