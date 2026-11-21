import { t } from "../../lib/i18n/index.ts";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import * as chatSettings from "../../lib/services/chatSettings.ts";
import { type ChatMode, isOn } from "../chat/modes.ts";
import ChatModePresets from "../chat/ChatModePresets.tsx";
import IconButton from "../ui/IconButton.tsx";
import PopoverButton from "../ui/PopoverButton.tsx";

type Props = {
  mode: ChatMode;
  broadcasterId: string;
};

export default function ModeButton(props: Props) {
  const mode = props.mode;
  const Icon = mode.icon;
  const settings = () => chatSettingsFor(props.broadcasterId);
  const on = () => {
    const s = settings();
    return s ? isOn(mode, s) : false;
  };

  if (mode.kind === "timed") {
    const length = () => {
      const s = settings();
      return s && isOn(mode, s) ? mode.short(s) : undefined;
    };
    return (
      <PopoverButton
        look="menu"
        label={t(mode.label)}
        icon={<Icon class="size-4" />}
        value={length()}
        pressed={on()}
        disabled={!settings()}
      >
        {() => (
          <ChatModePresets mode={mode} broadcasterId={props.broadcasterId} />
        )}
      </PopoverButton>
    );
  }

  return (
    <IconButton
      label={t(mode.label)}
      size="sm"
      pressed={on()}
      disabled={!settings()}
      onClick={() =>
        chatSettings.update(props.broadcasterId, on() ? mode.off : mode.on)
      }
    >
      <Icon class="size-4" />
    </IconButton>
  );
}
