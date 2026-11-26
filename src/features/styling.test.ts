/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vite-plus/test";

const CLASS_VALUE =
  /\bclass(?:List)?=(?:"([^"]*)"|\{`([\s\S]*?)`\}|\{"([^"]*)"\})/g;

const VISUAL =
  /^(?:[a-z-]+:)*(?:text-(?:xs|sm|base|lg|xl|[2-9]xl|ink(?:-soft|-faint)?|accent(?:-ink)?|positive|negative|caution|live|on-accent|feed-meta|\(--[a-z-]+\))|font-(?:medium|semibold|bold|normal|mono)|bg-|border-(?:line|line-soft|accent|negative|ink-faint)|rounded|shadow|ring-|opacity-|elevation-|floating-|underline|italic)/;

function visualClasses(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(CLASS_VALUE)) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";
    for (const token of value.split(/[\s"'`${}()?:]+/)) {
      if (VISUAL.test(token)) found.push(token);
    }
  }
  return found;
}

const root = path.resolve(import.meta.dirname);

const views = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return views(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });

const ALLOWED: Record<string, number> = {
  "activity/ui/rows/PinnedRow.tsx": 3,
  "activity/ui/rows/RaidRow.tsx": 2,
  "channel-tools/UnbanRequestsForm.tsx": 2,
  "channels/ui/LiveBadge.tsx": 13,
  "channels/ui/LivePill.tsx": 7,
  "chat/ChannelHeader.tsx": 10,
  "chat/ui/ConnectionBanner.tsx": 1,
  "chat/ui/ScrollStatusBar.tsx": 3,
  "commands/CommandComposer.tsx": 3,
  "commands/ui/CommandComposerSlot.tsx": 17,
  "composer/Actions.tsx": 8,
  "composer/ui/CharCounter.tsx": 4,
  "composer/ui/InputField.tsx": 4,
  "diagnostics/ui/ConnectionSlot.tsx": 2,
  "diagnostics/ui/MetricRow.tsx": 1,
  "emotes/picker/ui/EmoteGrid.tsx": 3,
  "emotes/picker/ui/Preview.tsx": 1,
  "emotes/picker/ui/RailButton.tsx": 5,
  "emotes/picker/ui/Section.tsx": 3,
  "emotes/ui/HoverZoom.tsx": 4,
  "explore/ChannelTile.tsx": 3,
  "explore/ExploreBar.tsx": 1,
  "explore/LiveCard.tsx": 1,
  "explore/ui/CategoryRow.tsx": 1,
  "feed/message/Avatar.tsx": 3,
  "feed/message/Message.tsx": 5,
  "feed/message/Reply.tsx": 7,
  "feed/message/Source.tsx": 3,
  "feed/ui/item/Content.tsx": 1,
  "feed/ui/item/Context.tsx": 2,
  "feed/ui/item/Detail.tsx": 1,
  "feed/ui/item/Item.tsx": 3,
  "feed/ui/item/Note.tsx": 2,
  "feed/ui/item/Tile.tsx": 1,
  "inbox/Item.tsx": 4,
  "link/ui/TabMuteBadge.tsx": 9,
  "login/Login.tsx": 4,
  "message/Badges.tsx": 2,
  "message/DisplayName.tsx": 1,
  "message/MessagePart.tsx": 4,
  "message/NameList.tsx": 1,
  "quick-switch/QuickSwitch.tsx": 5,
  "rail/Rail.tsx": 3,
  "rail/RailRow.tsx": 5,
  "rail/ui/ScrollChevron.tsx": 3,
  "settings/Settings.tsx": 1,
  "timers/TimersSettings.tsx": 3,
  "triggers/Replies.tsx": 1,
  "triggers/ReplyEditor.tsx": 1,
  "triggers/TriggerPreview.tsx": 4,
  "user-card/Header.tsx": 9,
  "user-card/RecentMessages.tsx": 1,
  "user-card/UserCard.tsx": 5,
  "user-card/ui/BanChoiceStrip.tsx": 2,
  "user-card/ui/Live.tsx": 5,
  "user-card/ui/Meta.tsx": 4,
  "whispers/Whispers.tsx": 1,
};

test("views style through kit components; hand styling only shrinks", () => {
  const counts: Record<string, number> = {};
  for (const file of views(root)) {
    const found = visualClasses(fs.readFileSync(file, "utf8"));
    if (found.length) {
      counts[path.relative(root, file).split(path.sep).join("/")] =
        found.length;
    }
  }
  expect(counts).toEqual(ALLOWED);
});

test("layout classes pass and visual classes are caught", () => {
  expect(
    visualClasses(`<div class="flex gap-2 px-4 min-w-0 truncate">`),
  ).toEqual([]);
  expect(
    visualClasses(
      '<span class={`text-sm ${on ? "text-negative" : "bg-raised"}`}>',
    ),
  ).toEqual(["text-sm", "text-negative", "bg-raised"]);
});
