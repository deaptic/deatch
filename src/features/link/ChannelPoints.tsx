import { createEffect, createSignal, on, Show } from "solid-js";
import { Coins } from "lucide-solid";
import { balances, bonusReady, claimBonus } from "./store.ts";
import RewardsPanel from "./RewardsPanel.tsx";
import { knownUser } from "../users/index.ts";
import {
  closeOverlay,
  isOverlayOpen,
  toggleOverlay,
} from "../navigation/index.ts";
import { t } from "../../shared/i18n/index.ts";
import { formatCount } from "../../shared/format/stream.ts";
import { POPOVER_TOGGLE } from "../../shared/solid/dismissOnOutside.ts";
import Button from "../../kit/Button.tsx";
import Text from "../../kit/Text.tsx";

type Props = {
  broadcasterId: string;
  anchorEl: () => HTMLElement | undefined;
};

export default function ChannelPoints(props: Props) {
  const login = () => knownUser(props.broadcasterId)?.login;
  const balance = () => {
    const name = login();
    return name ? balances()?.[name] : undefined;
  };
  const canClaim = () => {
    const name = login();
    return name !== undefined && bonusReady().includes(name);
  };
  const [gain, setGain] = createSignal<{ amount: number } | null>(null);
  createEffect(
    on([login, balance], ([name, next], previous) => {
      const [lastName, last] = previous ?? [];
      if (name !== lastName || next === undefined || last === undefined) {
        return;
      }
      if (next > last) setGain({ amount: next - last });
    }),
  );
  const action = () =>
    t(canClaim() ? "COMPOSER_CLAIM_BONUS_LABEL" : "COMPOSER_REWARDS_LABEL");
  const total = () =>
    t("COMPOSER_CHANNEL_POINTS_LABEL", { count: balance() ?? 0 });

  return (
    <Show when={balance() !== undefined}>
      <Button
        variant={canClaim() ? "accent" : "ghost"}
        size="md"
        icon={<Coins class="size-4" />}
        pressed={isOverlayOpen("channelRewards")}
        aria-label={`${action()}, ${total()}`}
        data-tip={canClaim() ? action() : total()}
        {...{ [POPOVER_TOGGLE]: "" }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const name = login();
          if (!name) return;
          if (canClaim()) claimBonus(name);
          else toggleOverlay("channelRewards");
        }}
      >
        <span class="relative">
          <Show
            when={gain()}
            keyed
            fallback={<span>{formatCount(balance() ?? 0)}</span>}
          >
            {(earned) => (
              <>
                <span class="inline-block animate-bump">
                  {formatCount(balance() ?? 0)}
                </span>
                <span
                  aria-hidden="true"
                  class="absolute bottom-full left-1/2 -translate-x-1/2 animate-gain pointer-events-none"
                  onAnimationEnd={() => setGain(null)}
                >
                  <Text size="xs" tone="accent" bold>
                    +{formatCount(earned.amount)}
                  </Text>
                </span>
              </>
            )}
          </Show>
        </span>
      </Button>
      <Show when={isOverlayOpen("channelRewards") && login()}>
        {(name) => (
          <RewardsPanel
            login={name()}
            balance={balance() ?? 0}
            anchorEl={props.anchorEl()}
            onClose={closeOverlay}
          />
        )}
      </Show>
    </Show>
  );
}
