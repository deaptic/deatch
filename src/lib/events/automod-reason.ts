// Pure label for why AutoMod held a message, kept apart from the listener so
// it can be tested without Tauri.

import type { RawAutomodMessageHold } from "../types/index.ts";
import { t } from "../i18n/index.ts";

/// Twitch sends only where each blocked term sits, so read it from the text.
// ponytail: boundaries read as code point indexes, end inclusive; adjust if
// Twitch turns out to count UTF-16 units or bytes.
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
    return t("AUTOMOD_BLOCKED_TERM", {
      kind: p.reason,
      terms: blockedTerms(p),
    });
  }
  return t("AUTOMOD_CATEGORY", {
    category: p.automod.category,
    level: p.automod.level,
  });
}
