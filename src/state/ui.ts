import { createSignal } from "solid-js";

type Panel = "settings" | "inbox" | "account" | "emotePicker";

export const [openPanel, setOpenPanel] = createSignal<Panel | null>(null);

export const isPanelOpen = (p: Panel) => openPanel() === p;
export const togglePanel = (p: Panel): void => {
  setOpenPanel(openPanel() === p ? null : p);
};
