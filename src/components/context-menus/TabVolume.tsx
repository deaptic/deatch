import { t } from "../../lib/i18n/index.ts";
import Button from "../ui/Button.tsx";
import Slider from "../ui/Slider.tsx";
import {
  DEFAULT_CHANNEL_GAIN,
  MAX_CHANNEL_GAIN,
} from "../../lib/constants/audio.ts";
import { channelGain, setChannelGain } from "../../lib/stores/preferences.ts";

type Props = {
  login: string;
};

import { formatWholePercent } from "../../lib/format/units.ts";
/// The volume of a channel's browser tab, after the compressor, as its own
/// menu section: the slider across the menu, its value and reset below.
export default function TabVolume(props: Props) {
  const gain = () => channelGain(props.login);

  return (
    <div class="px-2.5 pt-2 pb-1 flex flex-col gap-1">
      <span class="text-small text-ink-soft">{t("MENU_TAB_VOLUME")}</span>
      <Slider
        label={t("MENU_TAB_VOLUME")}
        value={gain()}
        min={0}
        max={MAX_CHANNEL_GAIN}
        format={formatWholePercent}
        onChange={(value) => setChannelGain(props.login, value)}
      />
      <div class="h-control-sm flex items-center justify-between">
        <span class="text-small tabular-nums text-ink">
          {formatWholePercent(gain())}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={gain() === DEFAULT_CHANNEL_GAIN}
          onClick={() => setChannelGain(props.login, DEFAULT_CHANNEL_GAIN)}
        >
          {t("COMMON_RESET")}
        </Button>
      </div>
    </div>
  );
}
