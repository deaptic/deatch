import { createCopied } from "./createCopied.ts";
import { t } from "../../lib/i18n/index.ts";

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
      label ? `${label}\n${t("UI_CLICK_TO_COPY")}` : t("UI_CLICK_TO_COPY"),
  };
}
