import { Check } from "lucide-solid";
import { For } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import MenuItem from "../../kit/MenuItem.tsx";
import SubMenu from "../../kit/SubMenu.tsx";
import { CHAT_MODES, type ChatMode, isOn, presetLabel } from "./modes.ts";
import ChatModePresets from "./ChatModePresets.tsx";
import * as chatSettings from "../../lib/services/chatSettings.ts";

type Props = {
  broadcasterId: string;
};

export default function ChatModesList(props: Props) {
  const settings = () => chatSettingsFor(props.broadcasterId);
  const on = (mode: ChatMode) => {
    const s = settings();
    return s ? isOn(mode, s) : false;
  };
  const hint = (mode: ChatMode) => {
    const s = settings();
    if (mode.kind !== "timed" || !s || !isOn(mode, s)) return undefined;
    const value = mode.current(s);
    const preset = mode.presets.find((p) => p.value === value);
    return preset && presetLabel(preset);
  };

  return (
    <For each={CHAT_MODES}>
      {(mode) =>
        mode.kind === "timed" ? (
          <SubMenu
            label={t(mode.label)}
            icon={on(mode) ? <Check /> : undefined}
            hint={hint(mode)}
          >
            <ChatModePresets mode={mode} broadcasterId={props.broadcasterId} />
          </SubMenu>
        ) : (
          <MenuItem
            label={t(mode.label)}
            icon={on(mode) ? <Check /> : undefined}
            onClick={() =>
              chatSettings.update(
                props.broadcasterId,
                on(mode) ? mode.off : mode.on,
              )
            }
          />
        )
      }
    </For>
  );
}
