import { Show, For, createEffect } from "solid-js";
import Navigation from "../ui/Navigation";
import MenuSection from "./MenuSection";
import MenuSectionItem from "./MenuSectionItem";
import SpeakerIcon from "../icons/SpeakerIcon";
import SpeakerOffIcon from "../icons/SpeakerOffIcon";
import ChevronUpIcon from "../icons/ChevronUpIcon";
import ChevronDownIcon from "../icons/ChevronDownIcon";
import {
  watchWarmedChannels,
  watchMutedByLogin,
} from "../../lib/stores/watch";
import { watchSetMuted } from "../../lib/api/watch";
import { hasUnread } from "../../lib/stores/feeds";
import { channelMentionCount } from "../../lib/stores/inbox";
import { createScrollAffordance } from "../../lib/primitives/createScrollAffordance";
import type { User } from "../../lib/types/twitch/user";

interface Props {
  selectedId: string | null;
  isLive: (id: string) => boolean;
  onSelect: (ch: User, fromWatched?: boolean) => void;
  onOpenInBrowser: (ch: User) => void;
  onContextMenu: (ch: User, x: number, y: number) => void;
}

export default function MenuWatchedList(props: Props) {
  const scroll = createScrollAffordance();
  createEffect(() => {
    watchWarmedChannels();
    queueMicrotask(scroll.update);
  });

  return (
    <Show when={watchWarmedChannels().length > 0}>
      <MenuSection divider="top">
        <div class="relative">
          <Show when={scroll.canUp()}>
            <button
              type="button"
              onClick={() => scroll.scrollByOne(-1)}
              class="absolute top-0 left-0 right-0 h-5 flex items-center justify-center bg-gradient-to-b from-bg-dark to-transparent z-10 text-text-muted hover:text-text cursor-pointer"
            >
              <ChevronUpIcon class="w-3 h-3" />
            </button>
          </Show>
          <div
            ref={scroll.setRef}
            onScroll={scroll.update}
            class="flex flex-col max-h-[10.5rem] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <Navigation
              orientation="vertical"
              scroll={false}
              indicatorClass="bg-primary rounded-r-full"
            >
              <For each={watchWarmedChannels()}>
                {(ch) => {
                  const isMuted = () => watchMutedByLogin()[ch?.login] === true;
                  return (
                    <div data-channel-id={ch?.id}>
                      <MenuSectionItem
                        channel={ch}
                        status={props.isLive(ch?.id) ? "live" : undefined}
                        selected={props.selectedId === ch?.id}
                        unread={hasUnread(ch?.id)}
                        mentions={channelMentionCount(ch?.id)}
                        onClick={() => props.onSelect(ch, true)}
                        onMiddleClick={() => props.onOpenInBrowser(ch)}
                        onContextMenu={(x, y) => props.onContextMenu(ch, x, y)}
                        bottomRight={
                          <div
                            role="button"
                            tabindex="0"
                            title={
                              isMuted() ? "Unmute browser tab" : "Mute browser tab"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              void watchSetMuted(ch?.login, !isMuted());
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            class={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg hover:bg-bg-light border border-border-muted flex items-center justify-center transition-colors cursor-pointer ${
                              isMuted()
                                ? "text-danger"
                                : "text-text-muted hover:text-text"
                            }`}
                          >
                            <Show
                              when={isMuted()}
                              fallback={<SpeakerIcon class="w-3.5 h-3.5" />}
                            >
                              <SpeakerOffIcon class="w-3.5 h-3.5" />
                            </Show>
                          </div>
                        }
                      />
                    </div>
                  );
                }}
              </For>
            </Navigation>
          </div>
          <Show when={scroll.canDown()}>
            <button
              type="button"
              onClick={() => scroll.scrollByOne(1)}
              class="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center bg-gradient-to-t from-bg-dark to-transparent z-10 text-text-muted hover:text-text cursor-pointer"
            >
              <ChevronDownIcon class="w-3 h-3" />
            </button>
          </Show>
        </div>
      </MenuSection>
    </Show>
  );
}
