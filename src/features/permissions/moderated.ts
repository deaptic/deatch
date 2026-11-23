import { createSignal } from "solid-js";
import type { UserRef } from "../../shared/types/index.ts";

export const [moderatedChannels, setModeratedChannels] = createSignal<
  UserRef[]
>([]);
