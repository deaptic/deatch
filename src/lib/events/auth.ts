import { events } from "../bindings.ts";
import { addToast } from "../stores/toasts.ts";
import { setUser } from "../stores/users.ts";
import { setDeviceCode, setWaiting } from "../stores/auth.ts";
import { errorMessage } from "../utils/error.ts";

events.authSucceeded.listen((e) => {
  setWaiting(false);
  setDeviceCode(null);
  setUser(e.payload);
  addToast("Connected to Twitch!", "success");
});

events.authFailed.listen((e) => {
  setWaiting(false);
  setDeviceCode(null);
  addToast(errorMessage(e.payload), "error");
});
