import { createEffect, createRoot, createSignal, on } from "solid-js";
import * as storage from "../../platform/storage.ts";
import { pointsKey } from "../../platform/storageKeys.ts";
import { startOfDay } from "../../shared/time.ts";
import { linkEnabled } from "../preferences/index.ts";
import { user } from "../users/index.ts";
import {
  parseHistory,
  type PointsHistory,
  pointsSince,
  withBalances,
} from "./pointsHistory.ts";

type Balances = Readonly<Record<string, number>>;

const [history, setHistory] = createSignal<PointsHistory>({});

export function record(before: Balances | null, after: Balances | null) {
  setHistory((current) =>
    withBalances(current, before, after, startOfDay(Date.now())),
  );
}

export const earnedSince = (since: number): Record<string, number> =>
  linkEnabled() ? pointsSince(history(), since) : {};

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(
        () => user()?.id,
        (id) => setHistory(id ? parseHistory(storage.read(pointsKey(id))) : {}),
      ),
    );
    createEffect(
      on(
        history,
        (current) => {
          const id = user()?.id;
          if (id) storage.write(pointsKey(id), current);
        },
        { defer: true },
      ),
    );
    return dispose;
  });
}
