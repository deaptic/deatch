import { currentChannel } from "../shared/channel.ts";
import { THEME } from "../shared/theme.ts";
import type { Life } from "../shared/life.ts";
import { watchFlag } from "../shared/storage.ts";
import { type Audio, gainOf, MAX_CHANNEL_GAIN } from "./settings.ts";
import { loadAudio, onAudio, setChannelGain, updateAudio } from "./store.ts";

const CONTROLS_ID = "deatch-player-controls";
const PLAYER_BAR = ".player-controls__left-control-group";
const STYLE = `
#${CONTROLS_ID}{display:flex;align-items:center;gap:4px;margin-left:4px;color:#fff;font-size:12px;font-weight:600;line-height:1}
#${CONTROLS_ID} button{display:grid;place-items:center;width:30px;height:30px;padding:0;border:0;border-radius:4px;background:transparent;color:inherit;cursor:pointer;transition:background-color 100ms cubic-bezier(.23,1,.32,1),color 100ms cubic-bezier(.23,1,.32,1),scale 100ms cubic-bezier(.23,1,.32,1)}
#${CONTROLS_ID} button:hover{background:rgb(255 255 255 / .15)}
#${CONTROLS_ID} button:active{scale:.94}
#${CONTROLS_ID} button[aria-pressed="true"]{color:${THEME.accentInk}}
#${CONTROLS_ID} input{appearance:none;width:100px;height:20px;margin:0 4px;background:transparent;cursor:pointer}
#${CONTROLS_ID} input::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:linear-gradient(#fff,#fff) 0/var(--fill,50%) 100% no-repeat,rgb(255 255 255 / .3)}
#${CONTROLS_ID} input::-webkit-slider-thumb{appearance:none;width:20px;height:20px;margin-top:-8px;border:0;border-radius:50%;background:#fff}
#${CONTROLS_ID} input::-moz-range-track{height:4px;border-radius:2px;background:rgb(255 255 255 / .3)}
#${CONTROLS_ID} input::-moz-range-progress{height:4px;border-radius:2px;background:#fff}
#${CONTROLS_ID} input::-moz-range-thumb{width:20px;height:20px;border:0;border-radius:50%;background:#fff}
#${CONTROLS_ID} [hidden]{display:none}
#${CONTROLS_ID} output{min-width:3.5ch;font-variant-numeric:tabular-nums;opacity:.85}
`;
const ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 11v2"/></svg>`;

type Parts = {
  wrap: HTMLDivElement;
  toggle: HTMLButtonElement;
  boost: HTMLInputElement;
  shown: HTMLOutputElement;
};

function build(life: Life): Parts {
  const wrap = document.createElement("div");
  wrap.id = CONTROLS_ID;
  const style = document.createElement("style");
  style.textContent = STYLE;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.innerHTML = ICON;
  toggle.title = "Compressor";
  life.listen(
    toggle,
    "click",
    () => void updateAudio((a) => ({ ...a, enabled: !a.enabled })),
  );

  const boost = document.createElement("input");
  boost.type = "range";
  boost.min = "0";
  boost.max = String(MAX_CHANNEL_GAIN);
  boost.step = "0.05";
  boost.setAttribute("aria-label", "Deatch channel volume");
  life.listen(boost, "input", () => {
    const channel = currentChannel();
    if (channel) void setChannelGain(channel, Number(boost.value));
  });

  const shown = document.createElement("output");

  wrap.append(style, toggle, boost, shown);
  return { wrap, toggle, boost, shown };
}

function show(parts: Parts, audio: Audio) {
  const gain = gainOf(audio, currentChannel());
  parts.toggle.setAttribute("aria-pressed", String(audio.enabled));
  parts.boost.value = String(gain);
  parts.boost.style.setProperty(
    "--fill",
    `${(gain / MAX_CHANNEL_GAIN) * 100}%`,
  );
  parts.shown.textContent = `${Math.round(gain * 100)}%`;
  parts.boost.setAttribute("aria-valuetext", parts.shown.textContent);
}

export function startPlayer(life: Life) {
  document.getElementById(CONTROLS_ID)?.remove();
  let audio: Audio | null = null;
  let parts: Parts | null = null;
  const shownOnPlayer = { gainControl: true, compressorControl: true };
  const anyShown = () =>
    shownOnPlayer.gainControl || shownOnPlayer.compressorControl;
  let queued = false;

  function sync() {
    if (!parts) return;
    parts.toggle.hidden = !shownOnPlayer.compressorControl;
    parts.boost.hidden = !shownOnPlayer.gainControl;
    parts.shown.hidden = !shownOnPlayer.gainControl;
    if (audio) show(parts, audio);
  }

  function mount() {
    if (!anyShown()) {
      document.getElementById(CONTROLS_ID)?.remove();
      parts = null;
      return;
    }
    const bar = document.querySelector(PLAYER_BAR);
    if (!bar || !currentChannel()) return;
    if (bar.querySelector(`#${CONTROLS_ID}`)) return;
    parts = build(life);
    bar.append(parts.wrap);
    sync();
  }

  function apply(next: Audio) {
    audio = next;
    sync();
  }

  void loadAudio().then(apply);
  onAudio(apply);

  for (const flag of ["gainControl", "compressorControl"] as const) {
    watchFlag(flag, (on) => {
      shownOnPlayer[flag] = on;
      mount();
      sync();
    });
  }

  life.observe(
    document.documentElement,
    { childList: true, subtree: true },
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        mount();
      });
    },
  );
}
