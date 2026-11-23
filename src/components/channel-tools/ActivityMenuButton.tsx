import { Layers } from "lucide-solid";
import { For, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { formatList } from "../../lib/format/list.ts";
import { activityFor } from "../../lib/stores/activity.ts";
import { pendingRaid } from "../../lib/stores/raid.ts";
import { runningActivities } from "../../lib/utils/runningActivities.ts";
import { ACTIVITIES, ACTIVITY_LABELS } from "../../lib/constants/activities.ts";
import {
  activityShown,
  setActivityShown,
} from "../../lib/stores/preferences/appearance.ts";
import IconMenuButton from "../ui/IconMenuButton.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { ActivityIcon } from "./activityIcons.tsx";

export default function ActivityMenuButton(props: { broadcasterId: string }) {
  const hidden = () =>
    runningActivities(
      activityFor(props.broadcasterId),
      pendingRaid()?.fromId === props.broadcasterId,
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
