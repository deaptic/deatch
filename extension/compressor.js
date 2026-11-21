
const RUMBLE = { type: "highpass", frequency: 30, Q: 0.71 };
const LIMITER = {
  threshold: -1.5,
  knee: 0,
  ratio: 20,
  attack: 0.001,
  release: 0.08,
};
const KNEE_DB = 12;

const CONTROLS = {
  threshold: { min: -60, max: 0, initial: -27 },
  ratio: { min: 1, max: 4.5, initial: 3.2 },
  attack: { min: 1, max: 50, initial: 3 },
  release: { min: 50, max: 1000, initial: 250 },
  gain: { min: -12, max: 12, initial: 0 },
};
const MAX_CHANNEL_GAIN = 2;
const RAMP_S = 0.05;

const initial = Object.fromEntries(
  Object.entries(CONTROLS).map(([name, c]) => [name, c.initial]),
);
let settings = { enabled: false, compressor: initial, gains: {} };
let ctx = null;
let waitingForGesture = false;
const chains = new Map();
const failed = new WeakSet();

function channel() {
  const name = location.pathname.split("/")[1]?.toLowerCase() ?? "";
  return /^[a-z0-9_]{3,25}$/.test(name) ? name : null;
}

const channelGain = () => settings.gains[channel()] ?? 1;
const inUse = () => settings.enabled || channelGain() !== 1;

function buildChain(video) {
  const source = ctx.createMediaElementSource(video);
  const rumble = new BiquadFilterNode(ctx, RUMBLE);
  const compressor = new DynamicsCompressorNode(ctx, { knee: KNEE_DB });
  const makeup = new GainNode(ctx);
  const gain = new GainNode(ctx);
  rumble
    .connect(compressor)
    .connect(makeup)
    .connect(gain)
    .connect(new DynamicsCompressorNode(ctx, LIMITER))
    .connect(ctx.destination);
  const inputs = { compressed: rumble, gain, direct: ctx.destination };
  const chain = {
    source,
    compressor,
    makeup,
    gain,
    inputs,
    path: null,
    level: null,
  };
  tune(chain);
  return chain;
}

const glide = (param, value) =>
  param.setTargetAtTime(value, ctx.currentTime, RAMP_S);

function tune({ compressor, makeup }) {
  const c = settings.compressor;
  glide(compressor.threshold, c.threshold);
  glide(compressor.ratio, c.ratio);
  glide(compressor.attack, c.attack / 1000);
  glide(compressor.release, c.release / 1000);
  glide(makeup.gain, 10 ** (c.gain / 20));
}

function route(chain) {
  const level = channelGain();
  const path = settings.enabled
    ? "compressed"
    : level !== 1
    ? "gain"
    : "direct";
  if (chain.path !== path) {
    chain.source.disconnect();
    chain.source.connect(chain.inputs[path]);
    chain.path = path;
  }
  if (chain.level !== level) {
    glide(chain.gain.gain, level);
    chain.level = level;
  }
}

function waitForGesture() {
  if (waitingForGesture) return;
  waitingForGesture = true;
  const retry = () => {
    waitingForGesture = false;
    removeEventListener("pointerdown", retry, true);
    removeEventListener("keydown", retry, true);
    void scan();
  };
  addEventListener("pointerdown", retry, true);
  addEventListener("keydown", retry, true);
}

const playsStream = (video) => video.src.startsWith("blob:");

async function attach(video) {
  if (chains.has(video) || failed.has(video) || !playsStream(video)) return;
  ctx ??= new AudioContext();
  if (ctx.state !== "running") await ctx.resume().catch(() => {});
  if (ctx.state !== "running") return waitForGesture();
  if (chains.has(video)) return;
  try {
    const chain = buildChain(video);
    chains.set(video, chain);
    route(chain);
  } catch (e) {
    failed.add(video);
    console.warn("[deatch] compressor could not attach", e);
  }
}

async function scan() {
  for (const [video, chain] of chains) {
    if (video.isConnected) continue;
    chain.source.disconnect();
    chains.delete(video);
  }
  for (const chain of chains.values()) route(chain);
  if (!inUse()) return;
  for (const video of document.querySelectorAll("video")) await attach(video);
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function apply(stored) {
  const compressor = {};
  for (const [name, c] of Object.entries(CONTROLS)) {
    const value = stored?.compressor?.[name];
    compressor[name] = Number.isFinite(value)
      ? clamp(value, c.min, c.max)
      : c.initial;
  }
  const gains = {};
  for (const [name, gain] of Object.entries(stored?.gains ?? {})) {
    if (Number.isFinite(gain)) gains[name] = clamp(gain, 0, MAX_CHANNEL_GAIN);
  }
  settings = { enabled: stored?.enabled === true, compressor, gains };
  for (const chain of chains.values()) tune(chain);
  void scan();
}

chrome.storage.local.get("audio").then(({ audio }) => apply(audio));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.audio) apply(changes.audio.newValue);
});

let rescan = false;
new MutationObserver(() => {
  if (rescan) return;
  rescan = true;
  queueMicrotask(() => {
    rescan = false;
    void scan();
  });
}).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["src"],
});
