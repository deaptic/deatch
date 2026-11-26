// @vitest-environment happy-dom
import { expect, test } from "vite-plus/test";
import { claimLife } from "../shared/life.ts";
import { startStatsReadout } from "./readout.ts";

const nextFrame = () =>
  new Promise((done) => requestAnimationFrame(() => setTimeout(done, 0)));

test("reloading the extension leaves one stats row", async () => {
  document.body.innerHTML = '<p><span class="live-time">1:23:45</span></p>';
  const data = document.documentElement.dataset;
  data.deatchPlayerStats = "on";
  data.deatchStats = JSON.stringify({ latency: 1.8, buffer: 2.1 });

  startStatsReadout(claimLife("ReadoutTest"));
  startStatsReadout(claimLife("ReadoutTest"));
  document.body.append(document.createElement("div"));
  await nextFrame();

  const rows = document.querySelectorAll("#deatch-stats");
  expect(rows).toHaveLength(1);
  expect(rows[0]?.textContent).toContain("1.8s");
});
