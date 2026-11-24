import { X } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import IconButton from "../../kit/IconButton.tsx";
import StripRow from "../../kit/StripRow.tsx";
import { streamerMode } from "../preferences/index.ts";
import * as streamer from "./store.ts";

function OnAirDot() {
  return (
    <span class="size-4 grid place-items-center">
      <span class="relative size-2 rounded-full bg-live">
        <span
          aria-hidden
          class="absolute inset-0 rounded-full bg-live animate-breathe"
        />
      </span>
    </span>
  );
}

export default function StreamerModeBanner() {
  return (
    <Show when={streamerMode() && !streamer.dismissed()}>
      <div class="shrink-0 bg-surface border-b border-line-soft">
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
      </div>
    </Show>
  );
}
