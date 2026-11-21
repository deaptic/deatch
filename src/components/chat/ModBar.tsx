import { Bookmark, Eraser, SlidersHorizontal, Tv } from "lucide-solid";
import { For, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { startCommercial } from "../../lib/api/twitch/channels.ts";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import { createStreamMarker } from "../../lib/api/twitch/streams.ts";
import Card from "../ui/Card.tsx";
import IconButton from "../ui/IconButton.tsx";
import ToolbarDivider from "../ui/ToolbarDivider.tsx";
import MenuButton from "../ui/MenuButton.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { AD_LENGTHS } from "../../lib/constants/twitch.ts";
import ChatModesList from "./ChatModesList.tsx";

type Props = {
  broadcasterId: string;
  isBroadcaster: boolean;
};

export default function ModBar(props: Props) {
  return (
    <Card>
      <div class="flex items-center gap-0.5 p-0.5">
        <MenuButton
          variant="ghost"
          label={t("CHAT_MOD_BAR_CHAT_MODES")}
          icon={<SlidersHorizontal class="size-4" />}
        >
          <ChatModesList broadcasterId={props.broadcasterId} />
        </MenuButton>
        <Show when={props.isBroadcaster}>
          <ToolbarDivider />
          <IconButton
            label={t("CHAT_MOD_BAR_ADD_MARKER")}
            size="sm"
            onClick={() => createStreamMarker().catch(() => {})}
          >
            <Bookmark class="size-4" />
          </IconButton>
          <MenuButton
            variant="ghost"
            label={t("CHAT_MOD_BAR_RUN_AD")}
            icon={<Tv class="size-4" />}
          >
            <For each={AD_LENGTHS}>
              {(length) => (
                <MenuItem
                  label={t("CHAT_MOD_BAR_AD_SECONDS", { count: length })}
                  onClick={() =>
                    startCommercial({
                      broadcasterId: props.broadcasterId,
                      length,
                    }).catch(() => {})
                  }
                />
              )}
            </For>
          </MenuButton>
        </Show>
        <span class="flex-1" />
        <MenuButton
          variant="ghost"
          label={t("CHAT_MOD_BAR_CLEAR_CHAT")}
          icon={<Eraser class="size-4" />}
        >
          <MenuItem
            label={t("CHAT_MOD_BAR_CLEAR_EVERY_MESSAGE")}
            tone="negative"
            onClick={() =>
              deleteChatMessages({
                broadcasterId: props.broadcasterId,
                messageId: null,
              }).catch(() => {})
            }
          />
        </MenuButton>
      </div>
    </Card>
  );
}
