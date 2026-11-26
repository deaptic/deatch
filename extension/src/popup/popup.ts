import {
  type Audio,
  CONTROL_NAMES,
  CONTROLS,
  type ControlName,
  initialCompressor,
} from "../audio/settings.ts";
import { loadAudio, updateAudio } from "../audio/store.ts";
import type { PopupState } from "../shared/messages.ts";
import { asRecord } from "../shared/record.ts";
import { type Flag, loadFlag, saveFlag } from "../shared/storage.ts";

type Format = (value: number) => string;

const LABELS: Record<ControlName, [string, Format]> = {
  threshold: ["Threshold", (v) => `${v} dB`],
  ratio: ["Ratio", (v) => `${v.toFixed(1)}:1`],
  attack: ["Attack", (v) => `${v} ms`],
  release: ["Release", (v) => `${v} ms`],
  gain: ["Gain", (v) => `${v > 0 ? "+" : ""}${v} dB`],
};

function byId<T extends HTMLElement>(id: string, type: new () => T): T {
  const found = document.getElementById(id);
  if (!(found instanceof type)) throw new Error(`popup is missing #${id}`);
  return found;
}

const status = byId("status", HTMLElement);
const controls = byId("controls", HTMLElement);
const reset = byId("reset", HTMLButtonElement);
const flagSwitches: Record<Flag, HTMLInputElement> = {
  autoClaim: byId("auto-claim", HTMLInputElement),
  autoDrops: byId("auto-drops", HTMLInputElement),
  gainControl: byId("gain-control", HTMLInputElement),
  compressorControl: byId("compressor-control", HTMLInputElement),
  playerStats: byId("player-stats", HTMLInputElement),
};

const switchEntries = Object.entries(flagSwitches) as [
  Flag,
  HTMLInputElement,
][];

type Slider = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: Format;
  onInput: (value: number) => void;
};

function slider({ label, value, min, max, step, format, onInput }: Slider) {
  const wrap = document.createElement("label");
  wrap.className = "slider";
  const head = document.createElement("span");
  head.className = "slider-head";
  const name = document.createElement("span");
  name.className = "slider-name";
  const shown = document.createElement("span");
  shown.className = "slider-value";
  name.textContent = label;
  shown.textContent = format(value);
  head.append(name, shown);
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener("input", () => {
    const next = Number(input.value);
    shown.textContent = format(next);
    onInput(next);
  });
  wrap.append(head, input);
  return wrap;
}

function renderControls(audio: Audio) {
  controls.replaceChildren(
    ...CONTROL_NAMES.map((name) => {
      const [label, format] = LABELS[name];
      const { min, max, step } = CONTROLS[name];
      return slider({
        label,
        format,
        value: audio.compressor[name],
        min,
        max,
        step,
        onInput: (value) =>
          void updateAudio((a) => ({
            ...a,
            compressor: { ...a.compressor, [name]: value },
          })),
      });
    }),
  );
}

async function popupState(): Promise<PopupState> {
  const reply: unknown = await chrome.runtime
    .sendMessage({ type: "popup_state" })
    .catch(() => null);
  return { connected: asRecord(reply).connected === true };
}

async function render() {
  const [audio, state] = await Promise.all([loadAudio(), popupState()]);
  for (const [flag, input] of switchEntries) {
    input.checked = await loadFlag(flag);
  }
  const statusText = status.lastElementChild;
  if (statusText) {
    statusText.textContent = state.connected ? "Connected" : "App not running";
  }
  status.classList.toggle("on", state.connected);
  renderControls(audio);
}

for (const [flag, input] of switchEntries) {
  input.addEventListener("change", () => void saveFlag(flag, input.checked));
}
reset.addEventListener("click", () => {
  void updateAudio((a) => ({ ...a, compressor: initialCompressor() })).then(
    renderControls,
  );
});

void render();
