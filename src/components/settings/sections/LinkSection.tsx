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
  { label: string; description: string; format: (value: number) => string }
> = {
  threshold: {
    label: "Threshold",
    description: "The level where compression starts.",
    format: db,
  },
  ratio: {
    label: "Ratio",
    description: "How firmly it compresses above the threshold.",
    format: (value) => `${value.toFixed(1)}:1`,
  },
  attack: {
    label: "Attack",
    description: "How fast it reacts when a stream gets louder.",
    format: ms,
  },
  release: {
    label: "Release",
    description: "How fast it lets go once it's quieter again.",
    format: ms,
  },
  gain: {
    label: "Gain",
    description:
      "Trims the level after compression. The compressor already adds some on its own as it works.",
    format: (value) => `${value > 0 ? "+" : ""}${value} dB`,
  },
};

const isDefault = () =>
  COMPRESSOR_CONTROLS.every((c) =>
    compressorSettings()[c] === DEFAULT_COMPRESSOR[c]
  );

export default function LinkSection() {
  return (
    <PageBody
      title="Link"
      lede="How Deatch works with the Twitch tabs in your browser."
    >
      <Card>
        <SettingsRow
          label="Compressor"
          description="Evens out every Twitch tab: quiet streams come up, loud moments come down, and nothing clips. Set a channel's own tab volume by right-clicking it in the rail."
        >
          <Toggle
            label="Compressor"
            checked={linkCompressor()}
            onChange={setLinkCompressor}
          />
        </SettingsRow>
        <Show when={linkConnected() && !linkHasAudio()}>
          <p class="px-5 pb-4 text-small text-caution">
            Update the Deatch Link extension in your browser to use the
            compressor and channel volumes.
          </p>
        </Show>
        <Disclosure label="Advanced">
          <For each={COMPRESSOR_CONTROLS}>
            {(control) => {
              const { label, description, format } = CONTROLS[control];
              const range = COMPRESSOR[control];
              const value = () => compressorSettings()[control];
              return (
                <SettingsRow label={label} description={description} stacked>
                  <div class="flex items-center gap-3">
                    <Slider
                      label={label}
                      value={value()}
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      format={format}
                      onChange={(v) =>
                        setCompressorControl(control, v)}
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
              Reset to defaults
            </Button>
          </div>
        </Disclosure>
      </Card>
    </PageBody>
  );
}
