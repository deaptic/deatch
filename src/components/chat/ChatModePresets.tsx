import { Check } from "lucide-solid";
import { For, Show } from "solid-js";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { applyChatMode, type TimedMode } from "./chatModes.ts";

type Props = {
  mode: TimedMode;
  broadcasterId: string;
  onDone: () => void;
};

export default function ChatModePresets(props: Props) {
  const current = () => {
    const s = chatSettingsFor(props.broadcasterId);
    return s ? props.mode.current(s) : null;
  };

  function apply(change: TimedMode["off"]) {
    props.onDone();
    applyChatMode(props.broadcasterId, change);
  }

  return (
    <>
      <For each={props.mode.presets}>
        {(preset) => (
          <MenuItem
            label={preset.label}
            icon={current() === preset.value ? <Check /> : undefined}
            onClick={() => apply(props.mode.set(preset.value))}
          />
        )}
      </For>
      <Show when={current() !== null}>
        <MenuDivider />
        <MenuItem
          label={`Turn off ${props.mode.label.toLowerCase()}`}
          onClick={() => apply(props.mode.off)}
        />
      </Show>
    </>
  );
}
