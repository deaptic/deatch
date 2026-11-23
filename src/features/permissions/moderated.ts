import { createSignal } from "solid-js";
import type { UserRef } from "../../lib/types/index.ts";

export const [moderatedChannels, setModeratedChannels] = createSignal<
  UserRef[]
>([]);
