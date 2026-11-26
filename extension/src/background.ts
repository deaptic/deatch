import { readAudio } from "./audio/settings.ts";
import {
  loadAudio,
  onAudio,
  setChannelGain,
  updateAudio,
} from "./audio/store.ts";
import { createCommandHandler } from "./link/commands.ts";
import { createHost } from "./link/host.ts";
import { buildState, createPublisher } from "./link/state.ts";
import { readReport } from "./rewards/read.ts";
import {
  type AnswerType,
  isAnswerType,
  readAnswer,
} from "./shared/protocol.ts";
import { claimBonus, claimDrops, redeemReward } from "./rewards/relay.ts";
import type { ChannelReport } from "./rewards/types.ts";
import { startAccess } from "./shared/access.ts";
import type { PopupState } from "./shared/messages.ts";
import { asRecord, isFiniteNumber } from "./shared/record.ts";
import { watchFlag } from "./shared/storage.ts";
import { closeChannel, focusChannel, muteChannel } from "./tabs/actions.ts";
import { createTabs } from "./tabs/registry.ts";
import { loadTabs, watchTabs } from "./tabs/watch.ts";

const tabs = createTabs();
const reports = new Map<string, ChannelReport>();
let gains: Record<string, number> = {};
const flags = { autoClaim: false, gainControl: true, compressorControl: true };
let compressorOn = false;

const host = createHost({
  onMessage: (message) => handleCommand(message),
  onConnect: () => refresh(),
});
const publisher = createPublisher(host.post);

function publish() {
  publisher.publish(
    buildState({
      summary: tabs.summary(),
      reports,
      gains: flags.gainControl ? gains : null,
      compressorOn: flags.compressorControl ? compressorOn : null,
      autoClaim: flags.autoClaim,
    }),
  );
}

function refresh() {
  publisher.reset();
  publish();
}

function answer(
  type: AnswerType,
  request: string | null,
  error: string | null,
) {
  host.post({ type, request, error });
}

const handleCommand = createCommandHandler(
  {
    set_gain: ({ channel, gain }) =>
      isFiniteNumber(gain) && setChannelGain(channel, gain),
    set_muted: ({ channel, muted }) => muteChannel(tabs, channel, !!muted),
    focus: ({ channel }) => focusChannel(tabs, channel),
    close: ({ channel }) => closeChannel(tabs, channel),
    claim_bonus: ({ channel }) => claimBonus(tabs, channel),
    redeem: (ask) =>
      redeemReward(tabs, ask, (request, error) =>
        answer("redeemed", request, error),
      ),
    claim_drops: (ask) =>
      claimDrops(tabs, ask, (request, error) =>
        answer("drops_claimed", request, error),
      ),
  },
  {
    get_state: refresh,
    set_compressor: ({ on }) =>
      typeof on === "boolean" &&
      updateAudio((audio) => ({ ...audio, enabled: on })),
    set_audio: ({ gains: legacy }) =>
      updateAudio((audio) => ({
        ...audio,
        gains: readAudio({ gains: legacy }).gains,
      })),
  },
);

function recordReport(message: unknown) {
  const report = readReport(message);
  if (!report) return;
  reports.set(report.channel, report);
  publish();
}

function onRuntimeMessage(
  message: unknown,
  _sender: chrome.runtime.MessageSender,
  reply: (state: PopupState) => void,
) {
  const { type } = asRecord(message);
  if (type === "report") recordReport(message);
  if (isAnswerType(type)) {
    const { request, error } = readAnswer(message);
    answer(type, request, error);
  }
  if (type === "popup_state") {
    reply({ connected: host.isConnected() });
  }
}

watchTabs(tabs, publish);
startAccess(() => void loadTabs(tabs).then(publish));
chrome.runtime.onMessage.addListener(onRuntimeMessage);
onAudio((audio) => {
  gains = audio.gains;
  compressorOn = audio.enabled;
  publish();
});
for (const flag of Object.keys(flags) as (keyof typeof flags)[]) {
  watchFlag(flag, (on) => {
    flags[flag] = on;
    publish();
  });
}

void (async () => {
  const audio = await loadAudio();
  gains = audio.gains;
  compressorOn = audio.enabled;
  await loadTabs(tabs);
  host.start();
})();
