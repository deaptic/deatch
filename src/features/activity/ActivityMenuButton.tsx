import { Layers } from "lucide-solid";
import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { formatList } from "../../shared/format/list.ts";
import * as activity from "./store.ts";
import * as raid from "./raid.ts";
import { runningActivities } from "./running.ts";
import { ACTIVITIES, ACTIVITY_LABELS } from "../../shared/activities.ts";
import { activityShown, setActivityShown } from "../preferences/index.ts";
import IconMenuButton from "../../kit/IconMenuButton.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import { ActivityIcon } from "./ui/ActivityIcon.tsx";

export default function ActivityMenuButton(props: { broadcasterId: string }) {
  const hidden = () =>
    runningActivities(
      activity.forChannel(props.broadcasterId),
      raid.pending()?.fromId === props.broadcasterId,
    ).filter((kind) => !activityShown(kind));
  const tip = () => {
    const names = hidden().map((kind) => t(ACTIVITY_LABELS[kind]));
    const label = t("HEADER_ACTIVITIES_LABEL");
    if (!names.length) return label;
    const status = t("HEADER_ACTIVITIES_HIDDEN_STATUS", {
      names: formatList(names),
    });
    return `${label}\n${status}`;
  };

  return (
    <IconMenuButton
      label={t("HEADER_ACTIVITIES_LABEL")}
      tip={tip()}
      icon={<Layers class="size-4" />}
      marker={
        <Show when={hidden().length}>
          <span class="pointer-events-none absolute top-1 right-1 size-1.5 rounded-full bg-accent" />
        </Show>
      }
    >
      <For each={ACTIVITIES}>
        {(kind) => (
          <MenuItem
            label={t(ACTIVITY_LABELS[kind])}
            icon={<ActivityIcon kind={kind} />}
            active={activityShown(kind)}
            keepOpen
            onClick={() => setActivityShown(kind, !activityShown(kind))}
          />
        )}
      </For>
    </IconMenuButton>
  );
}
