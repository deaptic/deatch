import { createContext } from "solid-js";

export const SettingsQuery = createContext<() => string>(() => "");
