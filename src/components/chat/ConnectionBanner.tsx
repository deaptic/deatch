import { Unplug } from "lucide-solid";
import { t } from "../../lib/i18n/index.ts";

export default function ConnectionBanner() {
  return (
    <div
      role="status"
      class="flex items-center gap-3 px-4 py-2.5 bg-raised border-b border-line-soft"
    >
      <Unplug class="size-4 shrink-0 text-caution" />
      <span class="min-w-0 truncate text-body text-ink">
        {t("CHAT_DISCONNECTED_BANNER")}{" "}
        <span class="text-ink-soft">
          {t("CHAT_DISCONNECTED_BANNER_DETAIL")}
        </span>
      </span>
    </div>
  );
}
