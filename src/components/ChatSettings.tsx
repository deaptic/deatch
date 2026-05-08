import { createSignal, For, Show } from "solid-js";
import {
  COLORS,
  NOTIF_EVENTS,
  BADGE_CATEGORIES,
  type ColorKey,
  type NotifKey,
  type BadgeCategoryKey,
} from "../constants";
import type { EventPref, BadgePref } from "../preferences";
import { toast } from "../notifications";
import Toggle from "../ui/Toggle";
import Stepper from "../ui/Stepper";

type Props = {
  isMod: boolean;
  fontSize: () => number;
  onFontSizeChange: (delta: number) => void;
  mutedUsers: () => string[];
  onMutedUsersChange: (value: string[]) => void;
  notifPrefs: () => Record<NotifKey, EventPref>;
  onNotifPrefChange: (key: NotifKey, value: boolean) => void;
  badgePrefs: () => Record<BadgeCategoryKey, BadgePref>;
  onBadgePrefChange: (key: BadgeCategoryKey, value: boolean) => void;
  onTestChatEvent: (key: NotifKey) => void;
  useDisplayName: () => boolean;
  onUseDisplayNameChange: (value: boolean) => void;
  onResetDefaults: () => void;
};

const TESTABLE_EVENTS = NOTIF_EVENTS.filter(
  (e): e is typeof e & { testMessage: string } => "testMessage" in e,
);

export default function ChatSettings(props: Props) {
  const [open, setOpen] = createSignal(false);
  const [testType, setTestType] = createSignal<ColorKey>("info");
  const [testChatType, setTestChatType] = createSignal<NotifKey>(
    TESTABLE_EVENTS[0].key,
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        class={`w-6 h-6 flex items-center justify-center transition-colors cursor-pointer rounded hover:bg-[#2d2d35] ${open() ? "text-white" : "text-[#5c5c7a] hover:text-white"}`}
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
          <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      </button>
      {open() && (
        <>
          <div class="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div class="absolute top-full right-0 mt-1 z-20 w-72 max-h-[calc(100vh-4rem)] overflow-y-auto bg-[#1f1f23] border border-[#2d2d35] rounded-lg shadow-2xl p-3 flex flex-col gap-3">
            <div class="flex flex-col gap-2">
              <span class="text-[#adadb8] text-xs font-medium">General</span>
              <div class="flex items-center justify-between">
                <span class="text-[#efeff1] text-xs">Font size</span>
                <Stepper
                  label={String(props.fontSize())}
                  onDecrement={() => props.onFontSizeChange(-1)}
                  onIncrement={() => props.onFontSizeChange(1)}
                />
              </div>
            </div>
            <div class="border-t border-[#2d2d35] pt-3 flex flex-col gap-2">
              <span class="text-[#adadb8] text-xs font-medium">Users</span>
              <div class="flex items-center justify-between">
                <span class="text-[#efeff1] text-xs">Show display name</span>
                <Toggle checked={props.useDisplayName()} onChange={props.onUseDisplayNameChange} />
              </div>
              <input
                type="text"
                placeholder="Mute username..."
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const v = e.currentTarget.value.trim().toLowerCase();
                  e.currentTarget.value = "";
                  if (!v || props.mutedUsers().includes(v)) return;
                  props.onMutedUsersChange([...props.mutedUsers(), v]);
                }}
                class="bg-[#2d2d35] text-[#efeff1] text-xs rounded px-2 py-1 border border-[#3d3d4a] focus:outline-none focus:border-[#9146ff]"
              />
              <Show when={props.mutedUsers().length > 0}>
                <div class="flex flex-wrap gap-1">
                  <For each={props.mutedUsers()}>
                    {(name) => (
                      <span class="flex items-center gap-1 bg-[#2d2d35] border border-[#3d3d4a] rounded px-2 py-0.5 text-xs text-[#efeff1]">
                        {name}
                        <button
                          onClick={() =>
                            props.onMutedUsersChange(
                              props.mutedUsers().filter((n) => n !== name),
                            )
                          }
                          class="text-[#6e6e8f] hover:text-white cursor-pointer leading-none"
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </For>
                </div>
              </Show>
            </div>
            <div class="border-t border-[#2d2d35] pt-3 flex flex-col gap-2">
              <span class="text-[#adadb8] text-xs font-medium">Events</span>
              <For each={NOTIF_EVENTS}>
                {(e) => (
                  <div class="flex items-center justify-between">
                    <span class="text-[#efeff1] text-xs">{e.label}</span>
                    <Toggle
                      checked={props.notifPrefs()[e.key]?.show !== false}
                      onChange={(v) => props.onNotifPrefChange(e.key, v)}
                    />
                  </div>
                )}
              </For>
            </div>
            <div class="border-t border-[#2d2d35] pt-3 flex flex-col gap-2">
              <span class="text-[#adadb8] text-xs font-medium">Badges</span>
              <For each={BADGE_CATEGORIES}>
                {(c) => (
                  <div class="flex items-center justify-between">
                    <span class="text-[#efeff1] text-xs">{c.label}</span>
                    <Toggle
                      checked={props.badgePrefs()[c.key]?.show !== false}
                      onChange={(v) => props.onBadgePrefChange(c.key, v)}
                    />
                  </div>
                )}
              </For>
            </div>
            <div class="border-t border-[#2d2d35] pt-3 flex flex-col gap-2">
              <span class="text-[#adadb8] text-xs font-medium">Tests</span>
              <div class="flex flex-col gap-1">
                <span class="text-[#5c5c7a] text-[10px] uppercase tracking-wide">Toast notification</span>
                <div class="flex items-center gap-2">
                  <select
                    value={testType()}
                    onChange={(e) => setTestType(e.currentTarget.value as ColorKey)}
                    class="flex-1 bg-[#2d2d35] text-[#efeff1] text-xs rounded px-2 py-1 border border-[#3d3d4a] cursor-pointer"
                  >
                    {(Object.keys(COLORS) as ColorKey[]).map((k) => (
                      <option value={k}>{k}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => toast(`Test ${testType()} notification`, testType(), "This is a test notification description")}
                    class="text-xs text-[#efeff1] bg-[#2d2d35] hover:bg-[#3d3d4a] border border-[#3d3d4a] rounded px-2 py-1 cursor-pointer transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[#5c5c7a] text-[10px] uppercase tracking-wide">Chat event</span>
                <div class="flex items-center gap-2">
                  <select
                    value={testChatType()}
                    onChange={(e) => setTestChatType(e.currentTarget.value as NotifKey)}
                    class="flex-1 bg-[#2d2d35] text-[#efeff1] text-xs rounded px-2 py-1 border border-[#3d3d4a] cursor-pointer"
                  >
                    {TESTABLE_EVENTS.map((e) => (
                      <option value={e.key}>{e.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => props.onTestChatEvent(testChatType())}
                    class="text-xs text-[#efeff1] bg-[#2d2d35] hover:bg-[#3d3d4a] border border-[#3d3d4a] rounded px-2 py-1 cursor-pointer transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
            <div class="border-t border-[#2d2d35] pt-3">
              <button
                class="w-full text-left text-xs text-[#5c5c7a] hover:text-[#efeff1] transition-colors cursor-pointer"
                onClick={props.onResetDefaults}
              >
                Reset defaults
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
