import { createCopied } from "./createCopied.ts";
import { onActivateKey } from "./keyActivation.ts";

export function createCopyable(idle: string) {
  const { copied, copy } = createCopied();
  return {
    copy,
    handlers: (text: () => string) => ({
      role: "button" as const,
      tabIndex: 0,
      onClick: () => void copy(text()),
      onKeyDown: onActivateKey(() => void copy(text())),
    }),
    class: () =>
      `cursor-pointer transition-colors duration-snap ${
        copied() ? "text-positive" : `${idle} hover:text-ink`
      }`,
  };
}
