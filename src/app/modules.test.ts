// @vitest-environment happy-dom
/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import { expect, test, vi } from "vite-plus/test";

const features = path.resolve(import.meta.dirname, "../features");
const entries = [
  "../App.tsx",
  ...fs
    .readdirSync(features, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `../features/${entry.name}/index.ts`),
];

test.each(entries)("%s loads first without an import cycle", async (entry) => {
  vi.resetModules();
  await expect(import(entry)).resolves.toBeDefined();
});
