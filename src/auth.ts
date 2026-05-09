import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "./notifications";
import { setUser } from "./user-state";
import type { DeviceCode } from "./types";

const [waiting, setWaiting] = createSignal(false);
const [deviceCode, setDeviceCode] = createSignal<DeviceCode | null>(null);
const [authChecked, setAuthChecked] = createSignal(false);

export { waiting, deviceCode, authChecked, setWaiting, setDeviceCode, setAuthChecked };

export async function loginWithTwitch() {
  try {
    setDeviceCode(null);
    const code = await invoke<DeviceCode>("start_dcf_auth");
    setDeviceCode(code);
    setWaiting(true);
  } catch (e) {
    toast(String(e), "error");
  }
}

export function cancelAuth() {
  setWaiting(false);
  setDeviceCode(null);
}

export async function logout() {
  try {
    await invoke("revoke_access_token");
    setUser(null);
  } catch (e) {
    toast(String(e), "error");
  }
}
