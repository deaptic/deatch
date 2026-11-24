/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vite-plus/test";

const features = path.resolve(import.meta.dirname);
const src = path.dirname(features);
const STATEFUL = [
  "kit/toasts.ts",
  "kit/flash.ts",
  "kit/clipboard.ts",
  "shared/clock.ts",
  "shared/keyboard/shortcuts.ts",
];

const sources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")
      ? [full]
      : [];
  });

const IMPORT = /^import\s+(type\s+)?([\s\S]*?)\s+from\s+"([^"]+)";/gm;

function valueImports(file: string): string[] {
  const specs: string[] = [];
  for (const [, typeOnly, clause = "", spec = ""] of fs
    .readFileSync(file, "utf8")
    .matchAll(IMPORT)) {
    const names = /^\{([^}]*)\}$/.exec(clause.trim())?.[1];
    const onlyTypes =
      names !== undefined &&
      names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .every((n) => n.startsWith("type "));
    if (!typeOnly && !onlyTypes && spec.startsWith(".")) specs.push(spec);
  }
  return specs;
}

const featureOf = (file: string) =>
  path.relative(features, file).split(path.sep)[0];

function pureFiles(): Set<string> {
  const files = sources(features);
  const pure = new Set(files);
  let changed = true;
  while (changed) {
    changed = false;
    for (const file of pure) {
      const ok = valueImports(file).every((spec) => {
        const target = path.resolve(path.dirname(file), spec);
        const rel = path.relative(src, target).split(path.sep).join("/");
        if (rel.startsWith("kit/") || rel.startsWith("shared/")) {
          return !STATEFUL.includes(rel);
        }
        return featureOf(target) === featureOf(file) && pure.has(target);
      });
      if (!ok) {
        pure.delete(file);
        changed = true;
      }
    }
  }
  return pure;
}

test("views in ui/ read no state", () => {
  const pure = pureFiles();
  const impure = sources(features)
    .filter((file) => file.split(path.sep).includes("ui"))
    .filter((file) => !pure.has(file))
    .map((file) => path.relative(features, file));
  expect(impure).toEqual([]);
});
