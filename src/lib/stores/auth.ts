import { createSignal } from "solid-js";
import type { DcfAuthResponse } from "../types/twitch/auth.ts";

export const [waiting, setWaiting] = createSignal(false);
export const [deviceCode, setDeviceCode] = createSignal<DcfAuthResponse | null>(
  null,
);
export const [authChecked, setAuthChecked] = createSignal(false);
