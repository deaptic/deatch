import { Unplug } from "lucide-solid";
import Card from "../ui/Card.tsx";
import { t } from "../../lib/i18n/index.ts";

export default function ConnectionBanner() {
  return (
    <div class="enter-rise">
      <Card tone="floating">
        <div
          role="status"
          class="flex items-center gap-3 min-h-strip px-3.5 py-1"
        >
          <Unplug class="size-4 shrink-0 text-caution" />
          <span class="min-w-0 truncate text-body text-ink">
            {t("CHAT_DISCONNECTED_BANNER")}{" "}
            <span class="text-ink-soft">
              {t("CHAT_DISCONNECTED_BANNER_DETAIL")}
            </span>
          </span>
        </div>
      </Card>
    </div>
  );
}
