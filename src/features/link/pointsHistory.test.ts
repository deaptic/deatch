import { expect, test } from "vite-plus/test";
import {
  parseHistory,
  type PointsHistory,
  pointsSince,
  withBalances,
} from "./pointsHistory.ts";

const DAY = 24 * 60 * 60 * 1000;

test("only rises in a known balance count, per channel, on that day", () => {
  const history = withBalances(
    { [DAY]: { a: 10 } },
    { a: 100, b: 500 },
    { a: 150, b: 300, c: 999 },
    DAY,
  );
  expect(history).toEqual({ [DAY]: { a: 60 } });
});

test("a balance seen for the first time is not a gain", () => {
  const history = {};
  expect(withBalances(history, null, { a: 5000 }, DAY)).toBe(history);
});

test("days older than a week are dropped when a new gain arrives", () => {
  const today = 10 * DAY;
  const history = withBalances(
    { [2 * DAY]: { a: 5 }, [5 * DAY]: { a: 7 } },
    { a: 0 },
    { a: 3 },
    today,
  );
  expect(Object.keys(history).map(Number)).toEqual([5 * DAY, today]);
});

test("points add up per channel from a given day on", () => {
  const history: PointsHistory = { [DAY]: { a: 1 }, [2 * DAY]: { a: 2, b: 4 } };
  expect(pointsSince(history, 2 * DAY)).toEqual({ a: 2, b: 4 });
  expect(pointsSince(history, 0)).toEqual({ a: 3, b: 4 });
});

test("unreadable saved data is ignored", () => {
  expect(parseHistory("nope")).toEqual({});
  expect(
    parseHistory({ x: { a: 1 }, [DAY]: { a: "1" }, [2 * DAY]: { a: 2 } }),
  ).toEqual({
    [2 * DAY]: { a: 2 },
  });
});
