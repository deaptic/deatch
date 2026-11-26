import { createSignal } from "solid-js";

type Overlay =
  | "diagnostics"
  | "shortcuts"
  | "emotePicker"
  | "appearance"
  | "quickSwitch"
  | "search"
  | "composerActions"
  | "channelRewards"
  | "chatters";

const [openOverlay, setOpenOverlay] = createSignal<Overlay | null>(null);
export { openOverlay };

export const isOverlayOpen = (o: Overlay) => openOverlay() === o;
export const closeOverlay = () => setOpenOverlay(null);
export const toggleOverlay = (o: Overlay): void => {
  setOpenOverlay(openOverlay() === o ? null : o);
};

export type ChannelForm =
  | "poll"
  | "prediction"
  | "raid"
  | "info"
  | "unbans"
  | "blockedTerms"
  | "automod"
  | "clearChat";

export const [channelForm, setChannelForm] = createSignal<ChannelForm | null>(
  null,
);
