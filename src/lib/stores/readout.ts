import { createSignal } from "solid-js";

export const [readout, setReadout] = createSignal<string | null>(null);
