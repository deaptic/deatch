import { mkdir, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { build, type InlineConfig } from "vite";

export const EXTENSION_MANIFEST = "extension/public/manifest.json";
export const EXTENSION_BUILD = "extension/build";

const SRC = resolve("extension/src");
const OUT = resolve(EXTENSION_BUILD);
const SCRIPTS = ["background", "content", "page"];

function config(watch: boolean, extra: InlineConfig): InlineConfig {
  return {
    configFile: false,
    logLevel: "warn",
    publicDir: false,
    ...extra,
    build: {
      outDir: OUT,
      emptyOutDir: false,
      target: "esnext",
      minify: false,
      watch: watch ? {} : null,
      ...extra.build,
    },
  };
}

async function emptyOut(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  for (const entry of await readdir(OUT)) {
    await rm(join(OUT, entry), { recursive: true, force: true });
  }
}

export async function bundleExtension(watch = false): Promise<void> {
  await emptyOut();
  await build(
    config(watch, {
      root: SRC,
      publicDir: resolve("extension/public"),
      build: {
        rollupOptions: {
          input: resolve(SRC, "popup/popup.html"),
          output: {
            entryFileNames: "popup/[name].js",
            assetFileNames: "popup/[name][extname]",
          },
        },
      },
    }),
  );
  for (const name of SCRIPTS) {
    await build(
      config(watch, {
        build: {
          lib: {
            entry: resolve(SRC, `${name}.ts`),
            formats: ["iife"],
            name: "deatch",
            fileName: () => `${name}.js`,
          },
        },
      }),
    );
  }
}
