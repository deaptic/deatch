import { createSignal } from "solid-js";
import type { DeviceCode } from "../types";

export const [waiting, setWaiting] = createSignal(false);
export const [deviceCode, setDeviceCode] = createSignal<DeviceCode | null>(null);
export const [authChecked, setAuthChecked] = createSignal(false);

