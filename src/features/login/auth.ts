import { createSignal } from "solid-js";
import type { DcfAuthResponse } from "../../lib/types/index.ts";

export const [waiting, setWaiting] = createSignal(false);
export const [deviceCode, setDeviceCode] = createSignal<DcfAuthResponse | null>(
  null,
);
export const [authChecked, setAuthChecked] = createSignal(false);

export type RestoreFailure = "missingScope" | "unreachable";
export const [restoreFailure, setRestoreFailure] =
  createSignal<RestoreFailure | null>(null);
