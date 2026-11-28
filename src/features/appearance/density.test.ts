/// <reference types="node" />
import fs from "node:fs";
import { expect, test } from "vite-plus/test";
import {
  DEFAULT_UI_DENSITY,
  UI_DENSITIES,
} from "../../shared/accessibility.ts";

test("every density but the default has its own sizes in App.css", () => {
  const css = fs.readFileSync("src/App.css", "utf8");
  const missing = UI_DENSITIES.filter(
    (density) =>
      density !== DEFAULT_UI_DENSITY &&
      !css.includes(`[data-density="${density}"]`),
  );
  expect(missing).toStrictEqual([]);
});
