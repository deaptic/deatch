import { Check, ChevronLeft } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import {
  applyChatMode,
  CHAT_MODES,
  type ChatMode,
  isOn,
  type TimedMode,
} from "./chatModes.ts";
import ChatModePresets from "./ChatModePresets.tsx";

type Props = {
  broadcasterId: string;
  onDone: () => void;
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
    return mode.presets.find((p) => p.value === value)?.label;
  };

  function pick(mode: ChatMode) {
    if (mode.kind === "timed") return setTimed(mode);
    props.onDone();
    applyChatMode(props.broadcasterId, on(mode) ? mode.off : mode.on);
  }

  return (
    <Show
      when={timed()}
      fallback={
        <For each={CHAT_MODES}>
          {(mode) => (
            <MenuItem
              label={mode.label}
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
            label={mode().label}
            icon={<ChevronLeft />}
            onClick={() => setTimed(null)}
          />
          <MenuDivider />
          <ChatModePresets
            mode={mode()}
            broadcasterId={props.broadcasterId}
            onDone={props.onDone}
          />
        </>
      )}
    </Show>
  );
}
