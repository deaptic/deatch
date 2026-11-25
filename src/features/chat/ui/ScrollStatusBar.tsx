import { ChevronDown } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import Dot from "../../../kit/Dot.tsx";
import Text from "../../../kit/Text.tsx";

type Props = {
  unseen: number;
  onJump: () => void;
};

export default function ScrollStatusBar(props: Props) {
  return (
    <button
      type="button"
      onClick={props.onJump}
      class="w-full flex items-center gap-2 pl-4 pr-1.5 py-1 min-h-strip min-w-0 text-sm bg-surface cursor-pointer transition-colors duration-snap hover:bg-raised"
    >
      <Show
        when={props.unseen > 0}
        fallback={
          <Text truncate align="left" tone="soft" class="flex-1 min-w-0">
            {t("FEED_VIEWING_OLDER_STATUS")}
          </Text>
        }
      >
        <Dot tone="accent" size="md" />
        <Text truncate align="left" bold tone="accent" class="flex-1 min-w-0">
          {t("FEED_UNREAD_COUNT_LABEL", { count: props.unseen })}
        </Text>
      </Show>
      <span class="shrink-0 px-2.5 flex items-center gap-1">
        <Text bold tone="primary">
          {t("FEED_JUMP_TO_LATEST_LABEL")}
        </Text>
        <ChevronDown class="size-4" />
      </span>
    </button>
  );
}
