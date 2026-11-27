import { Eye } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import Button from "../../kit/Button.tsx";
import { createGridColumns } from "./createGridColumns.ts";
import { t } from "../../shared/i18n/index.ts";
import { formatCount } from "../../shared/format/stream.ts";
import { openUrl } from "../../platform/opener.ts";
import Card from "../../kit/Card.tsx";
import CardTitle from "./CardTitle.tsx";
import { moveGridFocus } from "../../kit/gridKeys.ts";
import CardEmpty from "./CardEmpty.tsx";
import PreviewTile from "./PreviewTile.tsx";
import PeriodSwitch, { type Period } from "./PeriodSwitch.tsx";
import { knownUser } from "../users/index.ts";
import type { Clip } from "../../shared/types/index.ts";

type Props = {
  clips: Clip[];
  hasChannels: boolean;
  period: Period;
  onPeriodChange: (period: Period) => void;
};

const ROWS_PER_PAGE = 2;

export default function TopClipsCard(props: Props) {
  const [rows, setRows] = createSignal(ROWS_PER_PAGE);
  const grid = createGridColumns();
  const shown = () => grid.columns() * rows();
  return (
    <Card>
      <CardTitle
        action={
          <PeriodSwitch value={props.period} onChange={props.onPeriodChange} />
        }
      >
        {t("HOME_TOP_CLIPS_TITLE")}
      </CardTitle>
      <div class="flex flex-col gap-2 px-2 pb-3">
        <Show
          when={props.clips.length > 0}
          fallback={
            <CardEmpty
              body={t(
                props.hasChannels
                  ? "HOME_TOP_CLIPS_EMPTY"
                  : "HOME_TOP_CLIPS_NO_CHANNELS_EMPTY",
              )}
            />
          }
        >
          <div
            ref={grid.setRef}
            onKeyDown={moveGridFocus}
            class="grid home-streams"
          >
            <For each={props.clips.slice(0, shown())}>
              {(clip) => (
                <PreviewTile
                  onClick={() => void openUrl(clip.url).catch(() => {})}
                  src={clip.thumbnailUrl}
                  icon={<Eye />}
                  value={formatCount(clip.views)}
                  title={clip.title}
                  subtitle={knownUser(clip.broadcasterId)?.displayName ?? ""}
                  tip={clip.title}
                />
              )}
            </For>
          </div>
          <Show when={props.clips.length > shown()}>
            <div class="px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRows(rows() + ROWS_PER_PAGE)}
              >
                {t("HOME_SHOW_MORE_LABEL", {
                  count: props.clips.length - shown(),
                })}
              </Button>
            </div>
          </Show>
        </Show>
      </div>
    </Card>
  );
}
