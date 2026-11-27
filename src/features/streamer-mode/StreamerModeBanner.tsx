import { Radio, X } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import IconButton from "../../kit/IconButton.tsx";
import Banner from "../../kit/Banner.tsx";
import { streamerMode } from "../preferences/index.ts";
import * as streamer from "./store.ts";
import Surface from "../../kit/Surface.tsx";
import PulseIcon from "../../kit/PulseIcon.tsx";

export default function StreamerModeBanner() {
  return (
    <Show when={streamerMode() && !streamer.dismissed()}>
      <Surface edge="bottom" class="shrink-0">
        <Banner
          icon={
            <PulseIcon tone="negative" pulse>
              <Radio class="size-4" />
            </PulseIcon>
          }
          title={t("STREAMER_MODE_ON_STATUS")}
          meta={t("STREAMER_MODE_SILENCED_STATUS")}
          actions={
            <>
              <Button variant="neutral" size="sm" onClick={streamer.turnOff}>
                {t("STREAMER_MODE_TURN_OFF_LABEL")}
              </Button>
              <IconButton
                label={t("STREAMER_MODE_DISMISS_LABEL")}
                tip={false}
                size="sm"
                onClick={streamer.dismiss}
              >
                <X class="size-4" />
              </IconButton>
            </>
          }
        />
      </Surface>
    </Show>
  );
}
