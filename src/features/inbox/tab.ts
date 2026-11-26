import { createSignal } from "solid-js";

export type Tab = "mentions" | "whispers";

const [tab, setTab] = createSignal<Tab>("mentions");
export { setTab, tab };
