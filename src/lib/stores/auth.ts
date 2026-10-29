import { createSignal } from "solid-js";
import type { DcfAuthResponse } from "../types/index.ts";

export const [waiting, setWaiting] = createSignal(false);
export const [deviceCode, setDeviceCode] = createSignal<DcfAuthResponse | null>(
  null,
);
export const [authChecked, setAuthChecked] = createSignal(false);

/// Why the stored session could not be restored, when the user should know.
export type RestoreFailure = "missingScope" | "unreachable";
export const [restoreFailure, setRestoreFailure] =
  createSignal<RestoreFailure | null>(null);
