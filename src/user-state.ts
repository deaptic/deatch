import { createSignal } from "solid-js";
import type { UserInfo, ModeratedChannel } from "./types";

const [user, setUser] = createSignal<UserInfo | null>(null);
const [moderatedChannels, setModeratedChannels] = createSignal<ModeratedChannel[]>([]);

export { user, setUser, moderatedChannels, setModeratedChannels };
