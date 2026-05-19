import { createSignal } from "solid-js";

export type Panel = "settings" | "inbox" | "account" | "emotePicker";

const [openPanel, setOpenPanel] = createSignal<Panel | null>(null);

export { openPanel, setOpenPanel };
export const isPanelOpen = (p: Panel) => openPanel() === p;
export const togglePanel = (p: Panel): void => {
  setOpenPanel(openPanel() === p ? null : p);
};
