import {
  Clapperboard,
  Eraser,
  ExternalLink,
  Gem,
  Gift,
  Heart,
  Info,
  Megaphone,
  PenLine,
  Plug,
  Radio,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  TrainFront,
  TriangleAlert,
  Trophy,
  Tv,
  Unplug,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Vote,
} from "lucide-solid";
import {
  type Component,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { openUrl } from "@tauri-apps/plugin-opener";
import { NOTICE_TO_EVENT } from "../../lib/constants.ts";
import type {
  AnnouncementColor,
  FeedEvent as Event,
  Person,
} from "../../lib/types/index.ts";
import type { EmoteMap } from "../../lib/stores/emotes.ts";
import type { CheermoteMap } from "../../lib/utils/cheermote.ts";
import { splitNames } from "../../lib/utils/splitNames.ts";
import { formatLocale, type MessageKey, t } from "../../lib/i18n/index.ts";
import DisplayName from "../ui/DisplayName.tsx";
import Fragments from "../ui/Fragments.tsx";
import Timestamp from "../ui/Timestamp.tsx";
import Toolbar from "../ui/Toolbar.tsx";
import ToolbarItem from "../ui/ToolbarItem.tsx";
import type { UserActions } from "../ui/userLink.ts";
import FeedItem, { type ItemLayout } from "./FeedItem.tsx";

export type EventOptions = UserActions & {
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
  onEventContextMenu?: (x: number, y: number, item: Event) => void;
};

type Props = ItemLayout & EventOptions & { item: Event };

type Look = {
  color: string;
  Icon: Component<{ class?: string }>;
  title: MessageKey;
};

const LOOKS: Record<string, Look> = {
  sub: {
    color: "var(--color-event-sub)",
    Icon: Gift,
    title: "EVENT_TITLE_SUB",
  },
  raid: {
    color: "var(--color-event-raid)",
    Icon: Swords,
    title: "EVENT_TITLE_RAID",
  },
  announcement: {
    color: "var(--color-event-announce)",
    Icon: Megaphone,
    title: "EVENT_TITLE_ANNOUNCEMENT",
  },
  charity_donation: {
    color: "var(--color-event-charity)",
    Icon: Heart,
    title: "EVENT_TITLE_CHARITY_DONATION",
  },
  shoutout: {
    color: "var(--color-event-shoutout)",
    Icon: Radio,
    title: "EVENT_TITLE_SHOUTOUT",
  },
  follow: {
    color: "var(--color-event-follow)",
    Icon: UserPlus,
    title: "EVENT_TITLE_FOLLOW",
  },
  bits_badge_tier: {
    color: "var(--color-event-bits)",
    Icon: Gem,
    title: "EVENT_TITLE_BITS_BADGE_TIER",
  },
  channel_points_redemption: {
    color: "var(--color-event-channel-points)",
    Icon: Star,
    title: "EVENT_TITLE_CHANNEL_POINTS_REDEMPTION",
  },
  clip_created: {
    color: "var(--color-accent-ink)",
    Icon: Clapperboard,
    title: "EVENT_TITLE_CLIP_CREATED",
  },
  chat_connected: {
    color: "var(--color-positive)",
    Icon: Plug,
    title: "EVENT_TITLE_CHAT_CONNECTED",
  },
  chat_disconnected: {
    color: "var(--color-ink-faint)",
    Icon: Unplug,
    title: "EVENT_TITLE_CHAT_DISCONNECTED",
  },
  chat_connect_failed: {
    color: "var(--color-negative)",
    Icon: TriangleAlert,
    title: "EVENT_TITLE_CHAT_CONNECT_FAILED",
  },
  chat_cleared: {
    color: "var(--color-caution)",
    Icon: Eraser,
    title: "EVENT_TITLE_CHAT_CLEARED",
  },
  moderation: {
    color: "var(--color-caution)",
    Icon: Shield,
    title: "EVENT_TITLE_MODERATION",
  },
  seventv_update: {
    color: "var(--color-info)",
    Icon: Sparkles,
    title: "EVENT_TITLE_SEVENTV_UPDATE",
  },
  channel_update: {
    color: "var(--color-info)",
    Icon: PenLine,
    title: "EVENT_TITLE_CHANNEL_UPDATE",
  },
  poll: {
    color: "var(--color-event-poll)",
    Icon: Vote,
    title: "EVENT_TITLE_POLL",
  },
  prediction: {
    color: "var(--color-event-channel-points)",
    Icon: Trophy,
    title: "EVENT_TITLE_PREDICTION",
  },
  bits_use: {
    color: "var(--color-event-bits)",
    Icon: Gem,
    title: "EVENT_TITLE_BITS_USE",
  },
  ad_break: {
    color: "var(--color-caution)",
    Icon: Tv,
    title: "EVENT_TITLE_AD_BREAK",
  },
  goal: {
    color: "var(--color-event-goal)",
    Icon: Target,
    title: "EVENT_TITLE_GOAL",
  },
  hype_train: {
    color: "var(--color-event-hype-train)",
    Icon: TrainFront,
    title: "EVENT_TITLE_HYPE_TRAIN",
  },
  shared_chat_session: {
    color: "var(--color-info)",
    Icon: Users,
    title: "EVENT_TITLE_SHARED_CHAT_SESSION",
  },
  stream_online: {
    color: "var(--color-positive)",
    Icon: Video,
    title: "EVENT_TITLE_STREAM_ONLINE",
  },
  stream_offline: {
    color: "var(--color-ink-faint)",
    Icon: VideoOff,
    title: "EVENT_TITLE_STREAM_OFFLINE",
  },
  local: {
    color: "var(--color-ink-faint)",
    Icon: Info,
    title: "EVENT_TITLE_LOCAL",
  },
};

// Spelled out in full: Tailwind only keeps theme colours whose names it finds
// in the source, so a built-up name would never reach the page.
const ANNOUNCEMENT_COLORS: Record<
  Exclude<AnnouncementColor, "primary">,
  string
> = {
  blue: "var(--color-event-announce-blue)",
  green: "var(--color-event-announce-green)",
  orange: "var(--color-event-announce-orange)",
  purple: "var(--color-event-announce-purple)",
};

/// A big gift stays a line until someone asks for the rest.
const RECIPIENTS_SHOWN = 8;

function lookFor(noticeType: string): Look {
  return LOOKS[noticeType] ?? LOOKS[NOTICE_TO_EVENT[noticeType]] ??
    LOOKS.local;
}

export default function FeedEvent(props: Props) {
  const item = props.item;

  const look = (): Look => {
    const base = lookFor(item.notice_type);
    const picked = item.announcement_color;
    return picked && picked !== "primary"
      ? { ...base, color: ANNOUNCEMENT_COLORS[picked] }
      : base;
  };
  const icon = () => <Dynamic component={look().Icon} />;

  // Only a known chatter becomes a name link; local notices stay text.
  const chatter: Person | undefined = item.chatter_user_id
    ? {
      id: item.chatter_user_id,
      login: item.chatter_login ?? item.chatter_name.toLowerCase(),
      name: item.chatter_name,
      color: item.color,
    }
    : undefined;
  const people = [...(chatter ? [chatter] : []), ...(item.people ?? [])];

  const name = (person: Person, shown = person.name) => (
    <DisplayName
      login={person.login}
      displayName={shown}
      color={person.color}
      userId={person.id}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const clipToolbar = () => (
    <Show when={item.clip}>
      {(clip) => (
        <Toolbar alwaysVisible>
          <ToolbarItem
            title={t("EVENT_VIEW_CLIP")}
            tone="success"
            onClick={() => openUrl(`https://clips.twitch.tv/${clip().id}`)}
          >
            <ExternalLink />
          </ToolbarItem>
        </Toolbar>
      )}
    </Show>
  );

  return (
    <FeedItem
      id={item.id}
      timestamp={item.timestamp}
      density={props.density}
      continued={props.continued}
      selected={props.selected}
      flush={props.flush}
      bare={props.bare}
      showTimestamp={props.showTimestamp}
      tone="event"
      toneColor={look().color}
      tile={() => (
        <FeedItem.Tile color={look().color}>
          <span class="feed-icon grid">{icon()}</span>
        </FeedItem.Tile>
      )}
      overlay={clipToolbar}
      onContextMenu={props.onEventContextMenu &&
        ((x, y) => props.onEventContextMenu!(x, y, item))}
    >
      <Show when={props.density === "comfortable"}>
        <FeedItem.Title>
          <span class="font-semibold text-(--tone)">{t(look().title)}</span>
          <Timestamp ts={item.timestamp} format="c" variant="inline" />
        </FeedItem.Title>
      </Show>
      <FeedItem.Content>
        <Show when={props.density === "compact"}>
          <span class="feed-icon inline-grid align-text-bottom mr-1.5 text-(--tone)">
            {icon()}
          </span>
        </Show>
        <For
          each={splitNames(item.system_message, people.map((p) => p.name))}
        >
          {(segment) =>
            "person" in segment
              ? name(people[segment.person], segment.text)
              : segment.text}
        </For>
      </FeedItem.Content>
      <FeedItem.Detail>
        <Show when={item.message}>
          {(words) => (
            <div>
              <Show when={chatter}>
                {(speaker) => <>{name(speaker())}:{" "}</>}
              </Show>
              <Fragments
                fragments={words()}
                emotes={props.emotes}
                cheermotes={props.cheermotes}
                onShowUserCard={props.onShowUserCard}
                onUserContextMenu={props.onUserContextMenu}
              />
            </div>
          )}
        </Show>
        <Show when={item.detail}>{(detail) => <div>{detail()}</div>}</Show>
        <Show when={item.recipients?.length ? item.recipients : undefined}>
          {(recipients) => (
            <Recipients
              recipients={recipients()}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
          )}
        </Show>
      </FeedItem.Detail>
    </FeedItem>
  );
}

function Recipients(props: UserActions & { recipients: Person[] }) {
  const [expanded, setExpanded] = createSignal(false);
  const hidden = () =>
    expanded() ? 0 : Math.max(0, props.recipients.length - RECIPIENTS_SHOWN);
  const shown = () =>
    props.recipients.slice(0, props.recipients.length - hidden());

  // The locale's own list ("a, b and 3 more"), with names and the button
  // slotted into its element parts.
  const parts = () => {
    const items = shown().map((r) => r.name);
    if (hidden()) items.push(t("EVENT_GIFT_MORE", { count: hidden() }));
    let element = 0;
    return new Intl.ListFormat(formatLocale())
      .formatToParts(items)
      .map((part) =>
        part.type === "element"
          ? { kind: "element" as const, index: element++, text: part.value }
          : { kind: "literal" as const, text: part.value }
      );
  };

  return (
    <div>
      {`${t("EVENT_GIFTED_TO")} `}
      <For each={parts()}>
        {(part) => (
          <Switch fallback={part.text}>
            <Match when={part.kind === "element" && shown()[part.index]}>
              {(recipient) => (
                <DisplayName
                  login={recipient().login}
                  displayName={recipient().name}
                  color={recipient().color}
                  userId={recipient().id}
                  onShowUserCard={props.onShowUserCard}
                  onUserContextMenu={props.onUserContextMenu}
                />
              )}
            </Match>
            <Match when={part.kind === "element"}>
              <button
                type="button"
                class="hover:text-ink transition-colors duration-snap"
                onClick={() => setExpanded(true)}
              >
                {part.text}
              </button>
            </Match>
          </Switch>
        )}
      </For>
    </div>
  );
}
