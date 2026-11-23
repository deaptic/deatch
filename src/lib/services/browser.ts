import { openUrl } from "../api/opener.ts";
import { channelUrl, rewardQueueUrl } from "../utils/twitchUrl.ts";

export function open(url: string): void {
  openUrl(url).catch(() => {});
}

export function openChannel(login: string): void {
  open(channelUrl(login));
}

export function openRewardQueue(login: string): void {
  open(rewardQueueUrl(login));
}
