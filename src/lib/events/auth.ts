import { listen } from "@tauri-apps/api/event";
import type { User } from "../api/twitch/users.ts";
import { addToast } from "../stores/toasts.ts";
import { setUser } from "../stores/users.ts";
import { setDeviceCode, setWaiting } from "../stores/auth.ts";

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
