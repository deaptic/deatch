import { listen } from "@tauri-apps/api/event";
import type { User } from "../api/twitch/users";
import { addToast } from "../stores/toasts";
import { setUser } from "../stores/users";
import { setWaiting, setDeviceCode } from "../stores/auth";

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
