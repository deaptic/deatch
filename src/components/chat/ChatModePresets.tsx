import { Check } from "lucide-solid";
import { For, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import * as chatSettings from "../../lib/services/chatSettings.ts";
import { presetLabel, type TimedMode } from "./modes.ts";

type Props = {
  mode: TimedMode;
  broadcasterId: string;
};

export default function ChatModePresets(props: Props) {
  const current = () => {
    const s = chatSettingsFor(props.broadcasterId);
    return s ? props.mode.current(s) : null;
  };

  function apply(change: TimedMode["off"]) {
    chatSettings.update(props.broadcasterId, change);
  }

  return (
    <>
      <For each={props.mode.presets}>
        {(preset) => (
          <MenuItem
            label={presetLabel(preset)}
            icon={current() === preset.value ? <Check /> : undefined}
            onClick={() => apply(props.mode.set(preset.value))}
          />
        )}
      </For>
      <Show when={current() !== null}>
        <MenuDivider />
        <MenuItem
          label={t(props.mode.offLabel)}
          onClick={() => apply(props.mode.off)}
        />
      </Show>
    </>
  );
}
