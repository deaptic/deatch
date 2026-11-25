import { type Accessor, createContext } from "solid-js";

export const ImageScale = createContext<Accessor<number>>(() => 1);
