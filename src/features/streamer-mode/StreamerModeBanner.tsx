import { X } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import IconButton from "../../kit/IconButton.tsx";
import StripRow from "../../kit/StripRow.tsx";
import { streamerMode } from "../preferences/index.ts";
import * as streamer from "./store.ts";
import Dot from "../../kit/Dot.tsx";
import Surface from "../../kit/Surface.tsx";

function OnAirDot() {
  return (
    <span class="size-4 grid place-items-center">
      <Dot tone="negative" size="md" pulse />
    </span>
  );
}

export default function StreamerModeBanner() {
  return (
    <Show when={streamerMode() && !streamer.dismissed()}>
      <Surface edge="bottom" class="shrink-0">
        <StripRow
          icon={<OnAirDot />}
          title={t("STREAMER_MODE_ON_STATUS")}
          meta={t("STREAMER_MODE_SILENCED_STATUS")}
          actions={
            <>
              <Button variant="neutral" size="sm" onClick={streamer.turnOff}>
                {t("STREAMER_MODE_TURN_OFF_LABEL")}
              </Button>
              <IconButton
                label={t("STREAMER_MODE_DISMISS_LABEL")}
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
