import { Layers } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
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
import IconButton from "../ui/IconButton.tsx";
import Menu from "../ui/Menu.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { OVERLAY_GAP } from "../ui/Popover.tsx";
import Presence from "../ui/Presence.tsx";
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
  const [anchor, setAnchor] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  let button: HTMLButtonElement | undefined;

  const close = () => setAnchor(null);

  function toggle() {
    if (anchor() || !button) return close();
    const r = button.getBoundingClientRect();
    setAnchor({ x: r.right, y: r.bottom + OVERLAY_GAP });
  }

  return (
    <>
      <span class="relative flex">
        <IconButton
          ref={button}
          label={t("HEADER_ACTIVITIES_LABEL")}
          tip={tip()}
          size="sm"
          pressed={anchor() !== null}
          aria-haspopup="menu"
          aria-expanded={anchor() !== null}
          onClick={toggle}
        >
          <Layers class="size-4" />
        </IconButton>
        <Show when={hidden().length}>
          <span class="pointer-events-none absolute top-1 right-1 size-1.5 rounded-full bg-accent" />
        </Show>
      </span>
      <Presence when={anchor()}>
        {(a) => (
          <Menu
            x={a().x}
            y={a().y}
            align="end"
            opener={() => button}
            onClose={close}
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
          </Menu>
        )}
      </Presence>
    </>
  );
}
