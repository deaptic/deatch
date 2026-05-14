import { listen } from "@tauri-apps/api/event";
import type { User } from "../commands/users";
import { addToast } from "../state/toasts";
import { setUser } from "../state/users";
import { setWaiting, setDeviceCode } from "../state/auth";

listen<User>("twitch-auth-success", (e) => {
  setWaiting(false);
  setDeviceCode(null);
  setUser(e.payload);
  addToast("Connected to Twitch!", "success");
});

listen<string>("twitch-auth-error", (e) => {
  setWaiting(false);
  setDeviceCode(null);
  addToast(e.payload, "error");
});
