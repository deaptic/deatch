import { Unplug } from "lucide-solid";
import { t } from "../../../shared/i18n/index.ts";
import Text from "../../../kit/Text.tsx";

export default function ConnectionBanner() {
  return (
    <div class="enter-expand">
      <div role="status" class="flex items-center gap-3 min-h-strip px-4 py-1">
        <Unplug class="size-4 shrink-0 text-caution" />
        <Text truncate size="md" tone="primary" class="min-w-0">
          {t("FEED_DISCONNECTED_STATUS")}{" "}
          <Text tone="soft">{t("FEED_RECONNECTING_STATUS")}</Text>
        </Text>
      </div>
    </div>
  );
}
