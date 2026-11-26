import { Volume2, VolumeOff } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import AvatarBadge from "../../../kit/AvatarBadge.tsx";

type Props = {
  muted: boolean;
  onToggle: () => void;
};

export default function TabMuteBadge(props: Props) {
  return (
    <AvatarBadge
      corner="end"
      tone={props.muted ? "negative" : "positive"}
      tip={t(props.muted ? "RAIL_UNMUTE_TAB_LABEL" : "RAIL_MUTE_TAB_LABEL")}
      onClick={props.onToggle}
    >
      <Show
        when={props.muted}
        fallback={<Volume2 class="size-3.5 enter-swap" />}
      >
        <VolumeOff class="size-3.5 enter-swap" />
      </Show>
    </AvatarBadge>
  );
}
