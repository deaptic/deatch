import { connected, hasAudio } from "./store.ts";
import { type MessageKey, t } from "../../shared/i18n/index.ts";
import { For, Show } from "solid-js";
import Button from "../../kit/Button.tsx";
import Card from "../../kit/Card.tsx";
import Disclosure from "../../kit/Disclosure.tsx";
import Page from "../../kit/Page.tsx";
import FormRow from "../../kit/FormRow.tsx";
import SliderRow from "../../kit/SliderRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import {
  COMPRESSOR,
  COMPRESSOR_CONTROLS,
  type CompressorControl,
  DEFAULT_COMPRESSOR,
} from "../../shared/audio.ts";
import {
  compressorSettings,
  linkCompressor,
  linkEnabled,
  resetCompressorSettings,
  setCompressorControl,
  setLinkCompressor,
  setLinkEnabled,
} from "../preferences/index.ts";
import { setLinkSynced } from "../navigation/index.ts";
import Text from "../../kit/Text.tsx";

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
    label: "SETTINGS_LINK_THRESHOLD_LABEL",
    description: "SETTINGS_LINK_THRESHOLD_DESCRIPTION",
    format: db,
  },
  ratio: {
    label: "SETTINGS_LINK_RATIO_LABEL",
    description: "SETTINGS_LINK_RATIO_DESCRIPTION",
    format: (value) => `${value.toFixed(1)}:1`,
  },
  attack: {
    label: "SETTINGS_LINK_ATTACK_LABEL",
    description: "SETTINGS_LINK_ATTACK_DESCRIPTION",
    format: ms,
  },
  release: {
    label: "SETTINGS_LINK_RELEASE_LABEL",
    description: "SETTINGS_LINK_RELEASE_DESCRIPTION",
    format: ms,
  },
  gain: {
    label: "SETTINGS_LINK_GAIN_LABEL",
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
    <Page title={t("SETTINGS_LINK_TITLE")}>
      <Card>
        <FormRow
          label={t("SETTINGS_LINK_ENABLED_LABEL")}
          description={t("SETTINGS_LINK_ENABLED_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_LINK_ENABLED_LABEL")}
            checked={linkEnabled()}
            onChange={(on) => {
              setLinkEnabled(on);
              if (!on) setLinkSynced(false);
            }}
          />
        </FormRow>
      </Card>
      <Show when={linkEnabled()}>
        <Card>
          <FormRow
            label={t("SETTINGS_LINK_COMPRESSOR_LABEL")}
            description={t("SETTINGS_LINK_COMPRESSOR_DESCRIPTION")}
          >
            <Toggle
              label={t("SETTINGS_LINK_COMPRESSOR_LABEL")}
              checked={linkCompressor()}
              onChange={setLinkCompressor}
            />
          </FormRow>
          <Show when={connected() && !hasAudio()}>
            <div class="px-4 pb-3">
              <Text as="p" size="sm" tone="caution">
                {t("SETTINGS_LINK_UPDATE_EXTENSION_HINT")}
              </Text>
            </div>
          </Show>
          <Disclosure label={t("SETTINGS_LINK_ADVANCED_TITLE")}>
            <For each={COMPRESSOR_CONTROLS}>
              {(control) => {
                const { label, description, format } = CONTROLS[control];
                const range = COMPRESSOR[control];
                const value = () => compressorSettings()[control];
                return (
                  <SliderRow
                    label={t(label)}
                    description={t(description)}
                    layout="stacked"
                    value={value()}
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    format={format}
                    onChange={(v) => setCompressorControl(control, v)}
                  />
                );
              }}
            </For>
            <div class="px-4 py-2.5 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                disabled={isDefault()}
                onClick={resetCompressorSettings}
              >
                {t("SETTINGS_LINK_RESET_LABEL")}
              </Button>
            </div>
          </Disclosure>
        </Card>
      </Show>
    </Page>
  );
}
