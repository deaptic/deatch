import { openUrl } from "./opener.ts";
import { channelUrl, rewardQueueUrl } from "../shared/twitchUrl.ts";

export function open(url: string): void {
  openUrl(url).catch(() => {});
}

export function openChannel(login: string): void {
  open(channelUrl(login));
}

export function openRewardQueue(login: string): void {
  open(rewardQueueUrl(login));
}
