import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import Slider from "../../kit/Slider.tsx";
import { DEFAULT_CHANNEL_GAIN, MAX_CHANNEL_GAIN } from "../../shared/audio.ts";
import { gains, setGain } from "./store.ts";

type Props = {
  login: string;
};

import { formatWholePercent } from "../../shared/format/units.ts";
import Text from "../../kit/Text.tsx";
export default function TabVolume(props: Props) {
  const gain = () =>
    Math.round((gains()?.[props.login] ?? 1) * DEFAULT_CHANNEL_GAIN);
  const set = (percent: number) =>
    setGain(props.login, percent / DEFAULT_CHANNEL_GAIN);

  return (
    <div class="px-2.5 pt-2 pb-1 flex flex-col gap-1">
      <Text size="sm" tone="soft">
        {t("MENU_TAB_VOLUME_LABEL")}
      </Text>
      <Slider
        label={t("MENU_TAB_VOLUME_LABEL")}
        value={gain()}
        min={0}
        max={MAX_CHANNEL_GAIN}
        format={formatWholePercent}
        onChange={(value) => set(value)}
      />
      <div class="h-control-sm flex items-center justify-between">
        <Text size="sm" tabular tone="primary">
          {formatWholePercent(gain())}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          disabled={gain() === DEFAULT_CHANNEL_GAIN}
          onClick={() => set(DEFAULT_CHANNEL_GAIN)}
        >
          {t("MENU_RESET_VOLUME_LABEL")}
        </Button>
      </div>
    </div>
  );
}
