import type { Life } from "./life.ts";
import { asRecord, isFiniteNumber, parseJson, stringOrNull } from "./record.ts";

const PAGE_KEYS = {
  channel: "deatchChannel",
  autoClaim: "deatchAutoClaim",
  autoDrops: "deatchAutoDrops",
  playerStats: "deatchPlayerStats",
  report: "deatchReport",
  stats: "deatchStats",
  audio: "deatchAudio",
} as const;

export type PageKey = keyof typeof PAGE_KEYS;

export const EVENTS = {
  claimBonus: "deatch-claim-bonus",
  redeem: "deatch-redeem",
  redeemed: "deatch-redeemed",
  claimDrops: "deatch-claim-drops",
  dropsClaimed: "deatch-drops-claimed",
} as const;

export const ANSWERS = {
  [EVENTS.redeemed]: "redeemed",
  [EVENTS.dropsClaimed]: "drops_claimed",
} as const;

export type AnswerType = (typeof ANSWERS)[keyof typeof ANSWERS];

const ANSWER_TYPES: ReadonlySet<unknown> = new Set(Object.values(ANSWERS));

export const isAnswerType = (value: unknown): value is AnswerType =>
  ANSWER_TYPES.has(value);

export type RedeemAsk = {
  reward: string;
  cost: number;
  text: string | null;
  request: string;
};

type Answer = { request: string | null; error: string | null };

const data = () => document.documentElement.dataset;

export const attributeOf = (key: PageKey) =>
  `data-${PAGE_KEYS[key].replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

export function readPage(key: PageKey): string | null {
  return data()[PAGE_KEYS[key]] ?? null;
}

export function writePage(key: PageKey, value: string | null) {
  if (value === null) delete data()[PAGE_KEYS[key]];
  else data()[PAGE_KEYS[key]] = value;
}

export const readPageJson = (key: PageKey): unknown => parseJson(readPage(key));

export const isOn = (key: PageKey) => readPage(key) === "on";

export function readRedeemAsk(value: unknown): RedeemAsk | null {
  const { reward, cost, text, request } = asRecord(value);
  if (typeof reward !== "string" || typeof request !== "string") return null;
  if (!isFiniteNumber(cost)) return null;
  return { reward, cost, text: stringOrNull(text), request };
}

export function readAnswer(value: unknown): Answer {
  const { request, error } = asRecord(value);
  return { request: stringOrNull(request), error: stringOrNull(error) };
}

export function emit(name: string, detail: unknown = null) {
  document.dispatchEvent(
    new CustomEvent(name, { detail: JSON.stringify(detail) }),
  );
}

export function listen(
  life: Life,
  name: string,
  handler: (detail: unknown) => void,
) {
  life.listen(document, name, (event) => {
    if (!(event instanceof CustomEvent) || typeof event.detail !== "string") {
      return;
    }
    handler(parseJson(event.detail));
  });
}
