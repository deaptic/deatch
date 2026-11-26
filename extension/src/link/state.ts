import type { ChannelReport } from "../rewards/types.ts";
import type { TabSummary } from "../tabs/registry.ts";

type StateInput = {
  summary: TabSummary;
  reports: ReadonlyMap<string, ChannelReport>;
  gains: Record<string, number> | null;
  compressorOn: boolean | null;
  autoClaim: boolean;
};

function latestEarnedAt(
  reports: Record<string, string>[],
): Record<string, string> {
  const latest: Record<string, string> = {};
  for (const report of reports) {
    for (const [channelID, at] of Object.entries(report)) {
      if (Date.parse(at) > Date.parse(latest[channelID] ?? "")) {
        latest[channelID] = at;
      } else {
        latest[channelID] ??= at;
      }
    }
  }
  return latest;
}

export function buildState({
  summary,
  reports,
  gains,
  compressorOn,
  autoClaim,
}: StateInput) {
  const open = summary.channels.flatMap(({ login }) => {
    const entry = reports.get(login);
    return entry ? [{ login, entry }] : [];
  });
  const each = <T>(pick: (entry: ChannelReport) => T) =>
    Object.fromEntries(open.map(({ login, entry }) => [login, pick(entry)]));
  return {
    type: "state",
    channels: summary.channels,
    current: summary.current,
    audio: true,
    gains,
    compressorOn,
    balances: Object.fromEntries(
      open.flatMap(({ login, entry }) =>
        entry.balance === null ? [] : [[login, entry.balance]],
      ),
    ),
    bonusReady: autoClaim
      ? []
      : open.filter(({ entry }) => entry.bonusReady).map(({ login }) => login),
    rewards: each((entry) => entry.rewards),
    subscribed: Object.fromEntries(
      open.flatMap(({ login, entry }) =>
        entry.subscribed === null ? [] : [[login, entry.subscribed]],
      ),
    ),
    drops: Object.fromEntries(
      open.flatMap(({ login, entry }) =>
        entry.drop ? [[login, entry.drop]] : [],
      ),
    ),
    earnedAt: latestEarnedAt(open.map(({ entry }) => entry.earnedAt)),
  };
}

export function createPublisher(post: (state: object) => boolean) {
  let last = "";
  return {
    publish(state: object) {
      const key = JSON.stringify(state);
      if (key !== last && post(state)) last = key;
    },
    reset() {
      last = "";
    },
  };
}
