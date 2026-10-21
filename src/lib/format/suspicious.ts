import { t } from "../i18n/index.ts";
import type { SuspiciousInfo } from "../types/feed.ts";

export function formatSuspicious(info: SuspiciousInfo): string {
  return t("FEED_SUSPICIOUS", {
    status: info.status,
    evasion: info.evasion,
    bannedElsewhere: String(info.bannedElsewhere),
  });
}
