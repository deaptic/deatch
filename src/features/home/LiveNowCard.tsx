import { createSignal, For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardTitle from "./CardTitle.tsx";
import Button from "../../kit/Button.tsx";
import CardEmpty from "./CardEmpty.tsx";
import { moveGridFocus } from "../../kit/gridKeys.ts";
import { liveStreams } from "../channels/index.ts";
import { byViewers } from "../explore/index.ts";
import { showExplore } from "../navigation/index.ts";
import { user } from "../users/index.ts";
import type { User } from "../../shared/types/index.ts";
import StreamTile from "./StreamTile.tsx";
import { createGridColumns } from "./createGridColumns.ts";

const ROWS_PER_PAGE = 2;

type Props = {
  onSelect: (channel: User) => void;
};

export default function LiveNowCard(props: Props) {
  const thumbnailVersion = Date.now();
  const [rows, setRows] = createSignal(ROWS_PER_PAGE);
  const grid = createGridColumns();
  const shown = () => grid.columns() * rows();
  const live = () =>
    byViewers(liveStreams().filter((s) => s.user.id !== user()?.id));
  const visible = () => live().slice(0, shown());

  return (
    <Card>
      <CardTitle>{t("HOME_LIVE_NOW_TITLE")}</CardTitle>
      <div class="flex flex-col gap-2 px-2 pb-3">
        <Show
          when={live().length > 0}
          fallback={
            <>
              <CardEmpty body={t("HOME_LIVE_NOW_EMPTY")} />
              <div class="px-2">
                <Button variant="ghost" size="sm" onClick={showExplore}>
                  {t("HOME_OPEN_EXPLORE_LABEL")}
                </Button>
              </div>
            </>
          }
        >
          <div
            ref={grid.setRef}
            onKeyDown={moveGridFocus}
            class="grid home-streams"
          >
            <For each={visible()}>
              {(stream) => (
                <StreamTile
                  stream={stream}
                  thumbnailVersion={thumbnailVersion}
                  onSelect={props.onSelect}
                />
              )}
            </For>
          </div>
          <Show when={live().length > shown()}>
            <div class="px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRows(rows() + ROWS_PER_PAGE)}
              >
                {t("HOME_SHOW_MORE_LABEL", {
                  count: live().length - shown(),
                })}
              </Button>
            </div>
          </Show>
        </Show>
      </div>
    </Card>
  );
}
