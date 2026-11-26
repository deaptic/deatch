import { bundleExtension, EXTENSION_BUILD } from "./extension-bundle.ts";

const watch = process.argv.includes("--watch");
await bundleExtension(watch);
console.log(
  watch
    ? `watching; load ${EXTENSION_BUILD} as the unpacked extension`
    : `built ${EXTENSION_BUILD}`,
);
