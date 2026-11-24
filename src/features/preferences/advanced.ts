import { prefs, setPrefs } from "./core.ts";

export const advancedHardwareAcceleration = () =>
  prefs.advanced.hardwareAcceleration;

export function setAdvancedHardwareAcceleration(value: boolean) {
  setPrefs("advanced", "hardwareAcceleration", value);
}
