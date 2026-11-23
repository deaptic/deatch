import { onCleanup } from "solid-js";
import { clearChatters } from "../stores/users.ts";
import * as channels from "../../features/channels/index.ts";

export function createChannelHooks(): void {
  onCleanup(channels.onChannel({ leave: clearChatters }));
}
