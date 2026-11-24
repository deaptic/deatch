import { Unplug } from "lucide-solid";
import { t } from "../../../shared/i18n/index.ts";

export default function ConnectionBanner() {
  return (
    <div class="enter-expand">
      <div role="status" class="flex items-center gap-3 min-h-strip px-4 py-1">
        <Unplug class="size-4 shrink-0 text-caution" />
        <span class="min-w-0 truncate text-body text-ink">
          {t("FEED_DISCONNECTED_STATUS")}{" "}
          <span class="text-ink-soft">{t("FEED_RECONNECTING_STATUS")}</span>
        </span>
      </div>
    </div>
  );
}
