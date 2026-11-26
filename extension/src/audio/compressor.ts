import { currentChannel } from "../shared/channel.ts";
import type { Life } from "../shared/life.ts";
import { log } from "../shared/log.ts";
import { attributeOf, readPage } from "../shared/protocol.ts";
import { parseJson } from "../shared/record.ts";
import { asRecord } from "../shared/record.ts";
import { type Audio, gainOf, readAudio } from "./settings.ts";

const RUMBLE: BiquadFilterOptions = {
  type: "highpass",
  frequency: 30,
  Q: 0.71,
};
const LIMITER: DynamicsCompressorOptions = {
  threshold: -1.5,
  knee: 0,
  ratio: 20,
  attack: 0.001,
  release: 0.08,
};
const KNEE_DB = 12;
const RAMP_S = 0.05;

type Path = "compressed" | "gain" | "direct";
type Chain = {
  source: MediaElementAudioSourceNode;
  compressor: DynamicsCompressorNode;
  makeup: GainNode;
  gain: GainNode;
  inputs: Record<Path, AudioNode>;
  path: Path | null;
  level: number | null;
};

const playsStream = (video: HTMLVideoElement) => video.src.startsWith("blob:");

type Graph = {
  ctx: AudioContext | null;
  chains: Map<HTMLVideoElement, Chain>;
  failed: WeakSet<HTMLVideoElement>;
};

function glide(chain: Chain, param: AudioParam, value: number) {
  param.setTargetAtTime(value, chain.source.context.currentTime, RAMP_S);
}

function sharedGraph(): Graph {
  const page = asRecord(window);
  const existing = page.deatchAudioGraph as Graph | undefined;
  if (existing) return existing;
  const graph: Graph = { ctx: null, chains: new Map(), failed: new WeakSet() };
  page.deatchAudioGraph = graph;
  return graph;
}

const settingsOnPage = (text: string | null): Audio =>
  readAudio(parseJson(text));

export function startCompressor(life: Life) {
  const graph = sharedGraph();
  const { chains, failed } = graph;
  let settingsText = readPage("audio");
  let settings = settingsOnPage(settingsText);
  let waitingForGesture = false;
  let rescanQueued = false;

  const channelGain = () => gainOf(settings, currentChannel());
  const inUse = () => settings.enabled || channelGain() !== 1;

  function tune(chain: Chain) {
    const c = settings.compressor;
    glide(chain, chain.compressor.threshold, c.threshold);
    glide(chain, chain.compressor.ratio, c.ratio);
    glide(chain, chain.compressor.attack, c.attack / 1000);
    glide(chain, chain.compressor.release, c.release / 1000);
    glide(chain, chain.makeup.gain, 10 ** (c.gain / 20));
  }

  function buildChain(context: AudioContext, video: HTMLVideoElement): Chain {
    const source = context.createMediaElementSource(video);
    const rumble = new BiquadFilterNode(context, RUMBLE);
    const compressor = new DynamicsCompressorNode(context, { knee: KNEE_DB });
    const makeup = new GainNode(context);
    const gain = new GainNode(context);
    rumble
      .connect(compressor)
      .connect(makeup)
      .connect(gain)
      .connect(new DynamicsCompressorNode(context, LIMITER))
      .connect(context.destination);
    const chain: Chain = {
      source,
      compressor,
      makeup,
      gain,
      inputs: { compressed: rumble, gain, direct: context.destination },
      path: null,
      level: null,
    };
    tune(chain);
    return chain;
  }

  function route(chain: Chain) {
    const level = channelGain();
    const path: Path = settings.enabled
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
      glide(chain, chain.gain.gain, level);
      chain.level = level;
    }
  }

  function waitForGesture() {
    if (waitingForGesture) return;
    waitingForGesture = true;
    const stops = ["pointerdown", "keydown"].map((type) =>
      life.listen(window, type, retry, { capture: true }),
    );
    function retry() {
      waitingForGesture = false;
      for (const stop of stops) stop();
      scan();
    }
  }

  function attach(video: HTMLVideoElement) {
    if (chains.has(video) || failed.has(video) || !playsStream(video)) return;
    graph.ctx ??= new AudioContext();
    const ctx = graph.ctx;
    if (ctx.state !== "running") {
      ctx.onstatechange = () => {
        if (life.current()) scan();
      };
      void ctx.resume().catch(() => {});
      waitForGesture();
      return;
    }
    try {
      const chain = buildChain(ctx, video);
      chains.set(video, chain);
      route(chain);
    } catch (error) {
      failed.add(video);
      log.warn("compressor could not attach", error);
    }
  }

  function scan() {
    for (const [video, chain] of chains) {
      if (video.isConnected) continue;
      chain.source.disconnect();
      chains.delete(video);
    }
    for (const chain of chains.values()) route(chain);
    if (!inUse()) return;
    for (const video of document.querySelectorAll("video")) attach(video);
  }

  function update() {
    const text = readPage("audio");
    if (text !== settingsText) {
      settingsText = text;
      settings = settingsOnPage(text);
      for (const chain of chains.values()) tune(chain);
    }
    scan();
  }

  life.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", attributeOf("audio")],
    },
    () => {
      if (rescanQueued) return;
      rescanQueued = true;
      queueMicrotask(() => {
        rescanQueued = false;
        update();
      });
    },
  );
  for (const chain of chains.values()) tune(chain);
  scan();
}
