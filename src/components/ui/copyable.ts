import { createCopied } from "../../lib/primitives/createCopied.ts";

/// Click-to-copy text: the same cursor, hover, green flash and hint
/// everywhere. `idle` is the text colour while nothing is copied.
export function createCopyable(idle: string) {
  const { copied, copy } = createCopied();
  return {
    copy,
    class: () =>
      `cursor-pointer transition-colors duration-snap ${
        copied() ? "text-positive" : `${idle} hover:text-ink`
      }`,
    tip: (label?: string) =>
      label ? `${label}\nClick to copy` : "Click to copy",
  };
}
