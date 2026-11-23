/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vite-plus/test";

const root = path.resolve(import.meta.dirname);

const sources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });

const IMPORT = /from\s+"(\.[^"]+)"|import\("(\.[^"]+)"\)/g;

test("features import each other only through index.ts", () => {
  const crossings: string[] = [];
  for (const file of sources(root)) {
    const own = path.relative(root, file).split(path.sep)[0];
    for (const match of fs.readFileSync(file, "utf8").matchAll(IMPORT)) {
      const spec = match[1] ?? match[2] ?? "";
      const target = path.resolve(path.dirname(file), spec);
      if (!target.startsWith(root + path.sep)) continue;
      const [feature, ...rest] = path.relative(root, target).split(path.sep);
      const viaIndex = rest.length === 1 && rest[0] === "index.ts";
      if (feature !== own && !viaIndex) {
        crossings.push(`${path.relative(root, file)} -> ${spec}`);
      }
    }
  }
  expect(crossings).toEqual([]);
});
