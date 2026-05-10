import { createSignal } from "solid-js";
import type { Channel } from "../types";

export const [selectedChannel, setSelectedChannel] = createSignal<Channel | null>(null);
