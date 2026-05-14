import { createSignal } from "solid-js";
import type { DeviceCode } from "../types";

const [waiting, setWaiting] = createSignal(false);
const [deviceCode, setDeviceCode] = createSignal<DeviceCode | null>(null);
const [authChecked, setAuthChecked] = createSignal(false);

export { waiting, setWaiting, deviceCode, setDeviceCode, authChecked, setAuthChecked };

export function cancel() {
  setWaiting(false);
  setDeviceCode(null);
}
