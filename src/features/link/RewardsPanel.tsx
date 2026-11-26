import { createSignal, For, Show } from "solid-js";
import { ArrowLeft, Coins, Gift } from "lucide-solid";
import { redeem, rewards, subscribed } from "./store.ts";
import { t } from "../../shared/i18n/index.ts";
import { formatCount } from "../../shared/format/stream.ts";
import { formatApproxDuration } from "../../shared/format/duration.ts";
import { rewardBlock, type RewardBlock, type Viewer } from "./rewards.ts";
import { addToast } from "../../kit/toasts.ts";
import type { LinkReward } from "../../shared/types/index.ts";
import AnchoredPanel from "../../kit/AnchoredPanel.tsx";
import Button from "../../kit/Button.tsx";
import IconButton from "../../kit/IconButton.tsx";
import IconTile from "../../kit/IconTile.tsx";
import ListRow from "../../kit/ListRow.tsx";
import PanelHeader from "../../kit/PanelHeader.tsx";
import Surface from "../../kit/Surface.tsx";
import Text from "../../kit/Text.tsx";
import Textarea from "../../kit/Textarea.tsx";

type Props = {
  login: string;
  balance: number;
  anchorEl?: HTMLElement | null;
  onClose: () => void;
};

const STATUS_LABELS = {
  paused: "COMPOSER_REWARD_PAUSED_STATUS",
  sold_out: "COMPOSER_REWARD_SOLD_OUT_STATUS",
} as const;

function blockLabel(block: RewardBlock): string {
  switch (block.kind) {
    case "status":
      return t(STATUS_LABELS[block.status]);
    case "cooldown":
      return t("COMPOSER_REWARD_COOLDOWN_STATUS", {
        time: formatApproxDuration(block.seconds),
      });
    case "subOnly":
      return t("COMPOSER_REWARD_SUB_ONLY_STATUS");
    case "limit":
      return t("COMPOSER_REWARD_LIMIT_STATUS");
    case "price":
      return t("COMPOSER_REWARD_PRICE_STATUS");
  }
}

function RewardTile(props: { reward: LinkReward }) {
  return (
    <IconTile size="md" color={props.reward.color}>
      <Show when={props.reward.image} fallback={<Gift />}>
        {(src) => <img src={src()} alt="" class="size-6" />}
      </Show>
    </IconTile>
  );
}

function Cost(props: { cost: number; note?: string }) {
  return (
    <span class="flex items-center gap-1">
      <Text size="sm" tone="soft" class="flex">
        <Coins class="size-3.5" />
      </Text>
      <Text size="sm" tone="soft" tabular>
        {formatCount(props.cost)}
      </Text>
      <Show when={props.note}>
        {(note) => (
          <Text size="sm" tone="soft" truncate>
            · {note()}
          </Text>
        )}
      </Show>
    </span>
  );
}

function RewardRow(props: {
  reward: LinkReward;
  viewer: Viewer;
  onSelect: () => void;
}) {
  const block = () => rewardBlock(props.reward, props.viewer, Date.now());
  const note = () => {
    const found = block();
    return found ? blockLabel(found) : undefined;
  };
  return (
    <ListRow disabled={block() !== null} onClick={props.onSelect}>
      <RewardTile reward={props.reward} />
      <span class="flex-1 min-w-0 flex flex-col">
        <Text truncate>{props.reward.title}</Text>
        <Cost cost={props.reward.cost} note={note()} />
      </span>
    </ListRow>
  );
}

export default function RewardsPanel(props: Props) {
  const [selected, setSelected] = createSignal<LinkReward | null>(null);
  const [text, setText] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  function report(reward: LinkReward, error: string | null) {
    if (error === null) {
      addToast(
        t("COMPOSER_REWARD_REDEEMED_TOAST", { title: reward.title }),
        "success",
      );
    } else if (error === "TIMEOUT") {
      addToast(
        t("COMPOSER_REWARD_UNCONFIRMED_TOAST", { title: reward.title }),
        "warn",
      );
    } else {
      addToast(
        t("COMPOSER_REWARD_FAILED_ERROR", { title: reward.title, code: error }),
        "error",
      );
    }
  }

  async function confirm(reward: LinkReward) {
    setBusy(true);
    const error = await redeem(
      props.login,
      reward,
      reward.input ? text().trim() : null,
    );
    setBusy(false);
    report(reward, error);
    if (error !== null && error !== "TIMEOUT") return;
    props.onClose();
  }

  return (
    <AnchoredPanel
      side="end"
      size="lg"
      label={t("COMPOSER_REWARDS_LABEL")}
      anchorEl={props.anchorEl}
      onClose={props.onClose}
    >
      <Show
        when={selected()}
        fallback={
          <>
            <div class="px-4 py-3 shrink-0">
              <PanelHeader
                title={t("COMPOSER_REWARDS_LABEL")}
                count={formatCount(props.balance)}
              />
            </div>
            <Surface tone="none" edge="top" class="flex-1 min-h-0 flex">
              <div class="flex-1 min-h-0 overflow-y-auto px-2 py-1.5 flex flex-col">
                <For
                  each={rewards(props.login)}
                  fallback={
                    <div class="px-2.5 py-2">
                      <Text as="p" size="sm" tone="soft">
                        {t("COMPOSER_REWARDS_EMPTY")}
                      </Text>
                    </div>
                  }
                >
                  {(reward) => (
                    <RewardRow
                      reward={reward}
                      viewer={{
                        balance: props.balance,
                        subscribed: subscribed(props.login),
                      }}
                      onSelect={() => {
                        setText("");
                        setSelected(reward);
                      }}
                    />
                  )}
                </For>
              </div>
            </Surface>
          </>
        }
      >
        {(reward) => (
          <form
            class="flex-1 min-h-0 flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              void confirm(reward());
            }}
          >
            <div class="px-3 py-3 shrink-0 flex items-center gap-2">
              <IconButton
                label={t("COMPOSER_REWARD_BACK_LABEL")}
                tip={false}
                size="sm"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft class="size-4" />
              </IconButton>
              <RewardTile reward={reward()} />
              <span class="flex-1 min-w-0 flex flex-col">
                <Text bold truncate>
                  {reward().title}
                </Text>
                <Cost cost={reward().cost} />
              </span>
            </div>
            <Surface tone="none" edge="top" class="flex-1 min-h-0 flex">
              <div class="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                <Show when={reward().prompt}>
                  {(prompt) => (
                    <Text as="p" size="sm" tone="soft" wrap="words">
                      {prompt()}
                    </Text>
                  )}
                </Show>
                <Show when={reward().input}>
                  <Textarea
                    autofocus
                    value={text()}
                    onInput={(e) => setText(e.currentTarget.value)}
                    placeholder={t("COMPOSER_REWARD_TEXT_PLACEHOLDER")}
                  />
                </Show>
              </div>
            </Surface>
            <Surface tone="none" edge="top" class="shrink-0 flex">
              <div class="flex-1 px-4 py-3 flex">
                <Button
                  type="submit"
                  class="flex-1"
                  loading={busy()}
                  disabled={reward().input && !text().trim()}
                >
                  {t("COMPOSER_REWARD_REDEEM_LABEL", {
                    cost: formatCount(reward().cost),
                  })}
                </Button>
              </div>
            </Surface>
          </form>
        )}
      </Show>
    </AnchoredPanel>
  );
}
