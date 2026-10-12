import { For, Show } from "solid-js";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import Chip from "../ui/Chip.tsx";
import { CHAT_MODES, isOn } from "./chatModes.ts";

type Props = {
  broadcasterId: string;
};

export default function ChatModes(props: Props) {
  const settings = () => chatSettingsFor(props.broadcasterId);
  const active = () => {
    const s = settings();
    return s ? CHAT_MODES.filter((mode) => isOn(mode, s)) : [];
  };

  return (
    <Show when={active().length > 0}>
      <div class="flex flex-wrap items-center gap-1.5 px-1 pb-2">
        <For each={active()}>
          {(mode) => (
            <Chip
              label={mode.chip(settings()!)}
              title={mode.description(settings()!)}
            />
          )}
        </For>
      </div>
    </Show>
  );
}
