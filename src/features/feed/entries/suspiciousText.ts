import { t } from "../../../shared/i18n/index.ts";
import type { SuspiciousInfo } from "../../../shared/types/index.ts";

export function formatSuspicious(info: SuspiciousInfo): string {
  return t("FEED_SUSPICIOUS_LABEL", {
    status: info.status,
    evasion: info.evasion,
    bannedElsewhere: String(info.bannedElsewhere),
  });
}
