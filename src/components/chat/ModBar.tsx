import { Bookmark, Eraser, SlidersHorizontal, Tv } from "lucide-solid";
import { For, Show } from "solid-js";
import { startCommercial } from "../../lib/api/twitch/channels.ts";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import { createStreamMarker } from "../../lib/api/twitch/streams.ts";
import Button from "../ui/Button.tsx";
import MenuButton from "../ui/MenuButton.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import ChatModesList from "./ChatModesList.tsx";

const AD_LENGTHS = [30, 60, 90, 120, 150, 180];

type Props = {
  broadcasterId: string;
  isBroadcaster: boolean;
};

export default function ModBar(props: Props) {
  const run = (action: Promise<void>) => void action.catch(() => {});

  return (
    <div class="shrink-0 flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-line-soft">
      <Show when={props.isBroadcaster}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Bookmark class="size-4" />}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run(createStreamMarker())}
        >
          Add marker
        </Button>
        <MenuButton
          variant="ghost"
          label="Run ad"
          icon={<Tv class="size-4" />}
        >
          {(close) => (
            <For each={AD_LENGTHS}>
              {(length) => (
                <MenuItem
                  label={`${length} seconds`}
                  onClick={() => {
                    close();
                    run(
                      startCommercial({
                        broadcasterId: props.broadcasterId,
                        length,
                      }),
                    );
                  }}
                />
              )}
            </For>
          )}
        </MenuButton>
      </Show>
      <MenuButton
        variant="ghost"
        label="Chat modes"
        icon={<SlidersHorizontal class="size-4" />}
      >
        {(close) => (
          <ChatModesList broadcasterId={props.broadcasterId} onDone={close} />
        )}
      </MenuButton>
      <MenuButton
        variant="ghost"
        label="Clear chat"
        icon={<Eraser class="size-4" />}
      >
        {(close) => (
          <MenuItem
            label="Clear every message"
            danger
            onClick={() => {
              close();
              run(
                deleteChatMessages({
                  broadcasterId: props.broadcasterId,
                  messageId: null,
                }),
              );
            }}
          />
        )}
      </MenuButton>
    </div>
  );
}
