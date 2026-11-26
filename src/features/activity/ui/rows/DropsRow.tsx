import { createSignal, Show } from "solid-js";
import type { LinkDrop } from "../../../../shared/types/index.ts";
import { t } from "../../../../shared/i18n/index.ts";
import { formatApproxDuration } from "../../../../shared/format/duration.ts";
import Button from "../../../../kit/Button.tsx";
import Meter from "../../../../kit/Meter.tsx";
import Banner from "../../../../kit/Banner.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";

type Props = {
  drop: LinkDrop;
  onClaim: () => Promise<void>;
};

export default function DropsRow(props: Props) {
  const [claiming, setClaiming] = createSignal(false);
  async function claim() {
    setClaiming(true);
    try {
      await props.onClaim();
    } finally {
      setClaiming(false);
    }
  }
  const minutes = () =>
    t("HEADER_ACTIVITY_DROP_MINUTES_VALUE", {
      watched: props.drop.watched,
      required: props.drop.required,
    });
  const done = () => props.drop.watched >= props.drop.required;
  const left = () =>
    done()
      ? props.drop.game
      : t("HEADER_ACTIVITY_DROP_LEFT_VALUE", {
          game: props.drop.game,
          time: formatApproxDuration(
            Math.max(0, props.drop.required - props.drop.watched) * 60,
          ),
        });
  return (
    <Banner
      icon={
        <Show when={props.drop.image} fallback={<ActivityIcon kind="drops" />}>
          {(src) => <img src={src()} alt="" class="size-5 object-contain" />}
        </Show>
      }
      title={props.drop.reward ?? props.drop.game}
      meta={props.drop.reward || done() ? left() : minutes()}
      actions={
        <Show when={done()}>
          <Button
            variant="accent"
            size="sm"
            loading={claiming()}
            onClick={() => void claim()}
          >
            {t("HEADER_ACTIVITY_DROP_CLAIM_LABEL")}
          </Button>
        </Show>
      }
    >
      <Meter
        value={props.drop.watched}
        max={props.drop.required}
        label={minutes()}
        tone={done() ? "positive" : "accent"}
      />
    </Banner>
  );
}
