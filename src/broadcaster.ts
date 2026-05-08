import { createSignal } from "solid-js";

export type ActiveBroadcaster = {
  id: string;
  login: string;
  name: string;
};

const [activeBroadcaster, setActiveBroadcaster] = createSignal<ActiveBroadcaster | null>(null);
export { activeBroadcaster, setActiveBroadcaster };
