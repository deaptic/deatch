import { createContext } from "solid-js";

export const FilterQuery = createContext<() => string>(() => "");
