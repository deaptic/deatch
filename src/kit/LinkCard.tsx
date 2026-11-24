import { Play } from "lucide-solid";
import { type JSX, Show } from "solid-js";
import { onMiddleClick, preventAutoscroll } from "./middleClick.ts";
import Thumbnail from "./Thumbnail.tsx";

type Props = {
  site: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  video?: boolean;
  action?: JSX.Element;
  onOpen: () => void;
};

export default function LinkCard(props: Props) {
  return (
    <div class="@container group flex max-w-sm items-start rounded-sm border-l-3 border-line bg-raised transition-colors duration-snap hover:border-accent hover:bg-overlay">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          props.onOpen();
        }}
        onAuxClick={onMiddleClick(props.onOpen)}
        onMouseDown={preventAutoscroll}
        class="flex min-w-0 flex-1 items-start gap-3 p-2.5"
      >
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-feed-meta text-ink-faint">
            <span class="font-medium">{props.site}</span>
          </span>
          <span class="truncate font-medium text-ink transition-colors duration-snap group-hover:text-accent-ink">
            {props.title}
          </span>
          <Show when={props.description}>
            {(description) => (
              <span class="truncate text-feed-meta text-ink-soft @max-2xs:hidden">
                {description()}
              </span>
            )}
          </Show>
        </span>
        <Show when={props.thumbnail}>
          {(src) => (
            <Thumbnail
              src={src()}
              shape={props.video ? "video" : "square"}
              fit={props.video ? "linesWide" : "lines"}
            >
              <Show when={props.video}>
                <span class="absolute inset-0 grid place-items-center">
                  <span class="grid size-5 place-items-center rounded-full bg-media-scrim text-on-accent">
                    <Play class="size-2.5 fill-current" />
                  </span>
                </span>
              </Show>
            </Thumbnail>
          )}
        </Show>
      </a>
      <Show when={props.action}>
        <div class="shrink-0 py-1.5 pr-1.5">{props.action}</div>
      </Show>
    </div>
  );
}
