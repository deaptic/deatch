import { mounted } from "../../shared/react.ts";
import type { ClaimButton } from "./twitch.ts";

const CLICK_DELAY_MS = 1000;
const CLICK_JITTER_MS = 5000;

export function hasOffer(button: ClaimButton): boolean {
  return (
    !button.props.hidden && !button.state?.error && button.getClaim() != null
  );
}

export function createBonus(isWanted: () => boolean) {
  let pending = false;

  function claimSoon(button: ClaimButton) {
    if (pending || !isWanted() || !hasOffer(button)) return;
    pending = true;
    setTimeout(
      () => {
        pending = false;
        if (isWanted() && mounted(button) && hasOffer(button)) button.onClick();
      },
      CLICK_DELAY_MS + Math.random() * CLICK_JITTER_MS,
    );
  }

  return { claimSoon };
}
