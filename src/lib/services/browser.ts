import { openUrl } from "../api/opener.ts";
import { channelUrl } from "../utils/twitchUrl.ts";

export function open(url: string): void {
  // invokeCommand has already logged and toasted a failure.
  openUrl(url).catch(() => {});
}

export function openChannel(login: string): void {
  open(channelUrl(login));
}
