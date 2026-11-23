import type { RawAutomodMessageHold } from "../types/index.ts";
import { t } from "../i18n/index.ts";

function blockedTerms(
  p: Exclude<RawAutomodMessageHold, { reason: "automod" }>,
) {
  const chars = Array.from(p.message.text);
  const terms = p.blocked_term.terms_found.map(({ boundary }) =>
    chars.slice(boundary.start_pos, boundary.end_pos + 1).join(""),
  );
  return [...new Set(terms)].join(", ");
}

export function automodReason(p: RawAutomodMessageHold): string {
  if (p.reason !== "automod") {
    return t("FEED_AUTOMOD_BLOCKED_TERM_VALUE", {
      kind: p.reason,
      terms: blockedTerms(p),
    });
  }
  return t("FEED_AUTOMOD_CATEGORY_VALUE", {
    category: p.automod.category,
    level: p.automod.level,
  });
}
