import { createCopied } from "./createCopied.ts";
import { t } from "../../lib/i18n/index.ts";
import { onActivateKey } from "./keyActivation.ts";

/// Click-to-copy text: the same cursor, hover, green flash and hint
/// everywhere. `idle` is the text colour while nothing is copied.
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
    tip: (label?: string) =>
      label ? `${label}\n${t("UI_CLICK_TO_COPY")}` : t("UI_CLICK_TO_COPY"),
  };
}
