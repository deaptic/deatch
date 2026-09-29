import { createSignal } from "solid-js";

export type Overlay = "inbox" | "emotePicker" | "quickSwitch";

const [openOverlay, setOpenOverlay] = createSignal<Overlay | null>(null);
export { openOverlay };

export const isOverlayOpen = (o: Overlay) => openOverlay() === o;
export const closeOverlay = () => setOpenOverlay(null);
export const toggleOverlay = (o: Overlay): void => {
  setOpenOverlay(openOverlay() === o ? null : o);
};
