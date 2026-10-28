import { type MessageKey, t } from "../../../lib/i18n/index.ts";
import { For, Show } from "solid-js";
import Button from "../../ui/Button.tsx";
import Card from "../../ui/Card.tsx";
import Disclosure from "../../ui/Disclosure.tsx";
import PageBody from "../../ui/PageBody.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Slider from "../../ui/Slider.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  COMPRESSOR,
  COMPRESSOR_CONTROLS,
  type CompressorControl,
  DEFAULT_COMPRESSOR,
} from "../../../lib/constants/audio.ts";
import { linkConnected, linkHasAudio } from "../../../lib/stores/link.ts";
import {
  compressorSettings,
  linkCompressor,
  resetCompressorSettings,
  setCompressorControl,
  setLinkCompressor,
} from "../../../lib/stores/preferences.ts";

const db = (value: number) => `${value} dB`;
const ms = (value: number) => `${value} ms`;

const CONTROLS: Record<
  CompressorControl,
  {
    label: MessageKey;
    description: MessageKey;
    format: (value: number) => string;
  }
> = {
  threshold: {
    label: "SETTINGS_LINK_THRESHOLD",
    description: "SETTINGS_LINK_THRESHOLD_DESCRIPTION",
    format: db,
  },
  ratio: {
    label: "SETTINGS_LINK_RATIO",
    description: "SETTINGS_LINK_RATIO_DESCRIPTION",
    format: (value) => `${value.toFixed(1)}:1`,
  },
  attack: {
    label: "SETTINGS_LINK_ATTACK",
    description: "SETTINGS_LINK_ATTACK_DESCRIPTION",
    format: ms,
  },
  release: {
    label: "SETTINGS_LINK_RELEASE",
    description: "SETTINGS_LINK_RELEASE_DESCRIPTION",
    format: ms,
  },
  gain: {
    label: "SETTINGS_LINK_GAIN",
    description: "SETTINGS_LINK_GAIN_DESCRIPTION",
    format: (value) => `${value > 0 ? "+" : ""}${value} dB`,
  },
};

const isDefault = () =>
  COMPRESSOR_CONTROLS.every(
    (c) => compressorSettings()[c] === DEFAULT_COMPRESSOR[c],
  );

export default function LinkSection() {
  return (
    <PageBody title={t("SETTINGS_LINK")} lede={t("SETTINGS_LINK_LEDE")}>
      <Card>
        <SettingsRow
          label={t("SETTINGS_LINK_COMPRESSOR")}
          description={t("SETTINGS_LINK_COMPRESSOR_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_LINK_COMPRESSOR")}
            checked={linkCompressor()}
            onChange={setLinkCompressor}
          />
        </SettingsRow>
        <Show when={linkConnected() && !linkHasAudio()}>
          <p class="px-5 pb-4 text-small text-caution">
            {t("SETTINGS_LINK_UPDATE_EXTENSION")}
          </p>
        </Show>
        <Disclosure label={t("SETTINGS_LINK_ADVANCED")}>
          <For each={COMPRESSOR_CONTROLS}>
            {(control) => {
              const { label, description, format } = CONTROLS[control];
              const range = COMPRESSOR[control];
              const value = () => compressorSettings()[control];
              return (
                <SettingsRow
                  label={t(label)}
                  description={t(description)}
                  stacked
                >
                  <div class="flex items-center gap-3">
                    <Slider
                      label={t(label)}
                      value={value()}
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      format={format}
                      onChange={(v) => setCompressorControl(control, v)}
                    />
                    <span class="w-16 shrink-0 text-right text-small tabular-nums text-ink">
                      {format(value())}
                    </span>
                  </div>
                </SettingsRow>
              );
            }}
          </For>
          <div class="px-5 py-3 flex justify-end border-t border-line-soft">
            <Button
              variant="ghost"
              size="sm"
              disabled={isDefault()}
              onClick={resetCompressorSettings}
            >
              {t("SETTINGS_LINK_RESET")}
            </Button>
          </div>
        </Disclosure>
      </Card>
    </PageBody>
  );
}
