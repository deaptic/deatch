import { expect, test } from "vite-plus/test";
import { crateFor, mismatches } from "./tauri-versions.ts";

test("pairs the api with tauri and each plugin with its crate", () => {
  expect(crateFor("@tauri-apps/api")).toBe("tauri");
  expect(crateFor("@tauri-apps/plugin-opener")).toBe("tauri-plugin-opener");
  expect(crateFor("@tauri-apps/cli")).toBeNull();
});

test("reports pairs whose major.minor differ", () => {
  const npm = new Map([
    ["@tauri-apps/api", "2.12.4"],
    ["@tauri-apps/plugin-opener", "2.7.2"],
    ["@tauri-apps/cli", "2.12.4"],
  ]);
  const crates = new Map([
    ["tauri", "2.12.0"],
    ["tauri-plugin-opener", "2.6.0"],
  ]);
  expect(mismatches(npm, crates)).toStrictEqual([
    {
      npm: "@tauri-apps/plugin-opener",
      npmVersion: "2.7.2",
      crate: "tauri-plugin-opener",
      crateVersion: "2.6.0",
    },
  ]);
});

test("ignores packages without a locked crate", () => {
  const npm = new Map([["@tauri-apps/plugin-window-state", "2.5.0"]]);
  expect(mismatches(npm, new Map())).toStrictEqual([]);
});
