import { openUrl } from "../api/opener.ts";
import { channelUrl } from "../utils/twitchUrl.ts";

export function open(url: string): void {
  openUrl(url).catch(() => {});
}

export function openChannel(login: string): void {
  open(channelUrl(login));
}
