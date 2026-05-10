import { createSignal } from "solid-js";
import type { UserInfo, ModeratedChannel } from "../types";

export const [user, setUser] = createSignal<UserInfo | null>(null);
export const [moderatedChannels, setModeratedChannels] = createSignal<ModeratedChannel[]>([]);
