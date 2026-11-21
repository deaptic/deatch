import { Check, ChevronLeft } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import {
  CHAT_MODES,
  type ChatMode,
  isOn,
  presetLabel,
  type TimedMode,
} from "./modes.ts";
import ChatModePresets from "./ChatModePresets.tsx";
import * as chatSettings from "../../lib/services/chatSettings.ts";

type Props = {
  broadcasterId: string;
};

export default function ChatModesList(props: Props) {
  const [timed, setTimed] = createSignal<TimedMode | null>(null);
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

  function pick(mode: ChatMode) {
    if (mode.kind === "timed") return setTimed(mode);
    chatSettings.update(props.broadcasterId, on(mode) ? mode.off : mode.on);
  }

  return (
    <Show
      when={timed()}
      fallback={
        <For each={CHAT_MODES}>
          {(mode) => (
            <MenuItem
              label={t(mode.label)}
              icon={on(mode) ? <Check /> : undefined}
              hint={hint(mode)}
              submenu={mode.kind === "timed"}
              onClick={() => pick(mode)}
            />
          )}
        </For>
      }
    >
      {(mode) => (
        <>
          <MenuItem
            label={t(mode().label)}
            icon={<ChevronLeft />}
            keepOpen
            onClick={() => setTimed(null)}
          />
          <MenuDivider />
          <ChatModePresets mode={mode()} broadcasterId={props.broadcasterId} />
        </>
      )}
    </Show>
  );
}
