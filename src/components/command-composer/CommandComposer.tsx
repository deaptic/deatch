import { createSignal, createMemo, createEffect, For, Show, onCleanup } from "solid-js";
import type { Command, CommandContext, CommandOption } from "./types";
import { chattersByChannel } from "../../lib/stores/users";
import { feedUserNickname } from "../../lib/stores/preferences";
import { getUsers } from "../../lib/api/twitch/users";
import Suggestions from "../suggestions/Suggestions";
import Banner from "../ui/Banner";
import CommandComposerSlot from "./CommandComposerSlot";

type Slot = {
  raw: string;
  resolved: unknown | null;
  displayLabel: string;
  error: string | null;
};

type UserSuggestion = {
  id: string;
  login: string;
  displayName: string;
  color: string;
  nickname?: string;
};

type Props = {
  command: Command;
  ctx: CommandContext;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
};

const DURATION_UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };

function parseDuration(raw: string): number | null {
  const m = raw.match(/^(\d+)([smhdw]?)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * (DURATION_UNITS[m[2]] ?? 1);
}

function slotSatisfied(opt: CommandOption, slot: Slot): boolean {
  if (slot.error) return false;
  return !opt.required || slot.resolved !== null;
}

export default function CommandComposer(props: Props) {
  const options = props.command.options;
  const [slots, setSlots] = createSignal<Slot[]>(
    options.map(() => ({ raw: "", resolved: null, displayLabel: "", error: null })),
  );
  const [activeIdx, setActiveIdx] = createSignal(0);
  const [resolving, setResolving] = createSignal(false);
  let activeInput: HTMLInputElement | undefined;
  let composerRef: HTMLDivElement | undefined;
  let popupHandleKey: ((e: KeyboardEvent) => boolean) | undefined;
  let requiredFlashTimer: number | undefined;
  const hasSlots = options.length > 0;
  onCleanup(() => clearTimeout(requiredFlashTimer));

  const activeOption = () => options[activeIdx()] ?? null;
  const activeSlot = () => slots()[activeIdx()];
  const activeRaw = () => activeSlot()?.raw ?? "";

  function patchSlot(idx: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function fillUserSlot(idx: number, raw: string, id: string, label: string) {
    patchSlot(idx, { raw, resolved: id, displayLabel: label, error: null });
  }

  createEffect(() => {
    activeIdx();
    queueMicrotask(() => {
      if (!hasSlots) {
        composerRef?.focus();
        return;
      }
      activeInput?.focus();
      const v = activeInput?.value ?? "";
      activeInput?.setSelectionRange(v.length, v.length);
    });
  });

  const userSuggestions = createMemo<UserSuggestion[]>(() => {
    const opt = activeOption();
    if (opt?.type !== "user" || activeSlot()?.resolved !== null) return [];
    const bucket = chattersByChannel.get(props.ctx.broadcasterId);
    if (!bucket) return [];
    const q = activeRaw().toLowerCase();
    type Ranked = UserSuggestion & { lastSeen: number };
    const starts: Ranked[] = [];
    const contains: Ranked[] = [];
    for (const c of bucket.values()) {
      const nickname = feedUserNickname(c.login);
      const fields = [c.login.toLowerCase(), c.displayName.toLowerCase()];
      if (nickname) fields.push(nickname.toLowerCase());
      const startsAny = q === "" || fields.some((f) => f.startsWith(q));
      const containsAny = !startsAny && fields.some((f) => f.includes(q));
      if (!startsAny && !containsAny) continue;
      const ranked: Ranked = {
        id: c.id, login: c.login, displayName: c.displayName, color: c.color,
        nickname, lastSeen: c.lastSeen,
      };
      (startsAny ? starts : contains).push(ranked);
    }
    const byRecency = (a: Ranked, b: Ranked) => b.lastSeen - a.lastSeen;
    return [...starts.sort(byRecency), ...contains.sort(byRecency)]
      .slice(0, 10)
      .map(({ lastSeen: _, ...rest }) => rest);
  });

  const showUserPopup = createMemo(
    () => activeOption()?.type === "user" && userSuggestions().length > 0,
  );

  const enumSuggestions = createMemo<string[]>(() => {
    const opt = activeOption();
    if (opt?.type !== "enum" || !opt.values) return [];
    if (activeSlot()?.resolved !== null) return [];
    const q = activeRaw().toLowerCase();
    if (q === "") return opt.values;
    return opt.values.filter((v) => v.toLowerCase().includes(q));
  });

  const showEnumPopup = createMemo(
    () => activeOption()?.type === "enum" && enumSuggestions().length > 0,
  );

  const errorActive = createMemo(() => !!activeSlot()?.error);

  const hintBody = createMemo(() => {
    if (resolving()) return "Looking up user…";
    const opt = activeOption();
    const slot = activeSlot();
    if (!opt || !slot) return hasSlots ? "" : props.command.description;
    if (slot.error) return slot.error;
    const base = opt.hint ?? opt.description;
    return opt.required && slot.resolved === null ? `Required · ${base}` : base;
  });

  const canSubmit = () => options.every((opt, i) => slotSatisfied(opt, slots()[i]));

  async function resolveUserSlot(idx: number): Promise<boolean> {
    const login = slots()[idx].raw.replace(/^@/, "").trim().toLowerCase();
    if (!login) return false;
    setResolving(true);
    try {
      const u = (await getUsers({ logins: [login] }))[0];
      if (!u) {
        patchSlot(idx, { error: `User not found: ${login}` });
        return false;
      }
      fillUserSlot(idx, u.displayName, u.id, u.displayName);
      return true;
    } catch (e) {
      console.error("user lookup failed", e);
      patchSlot(idx, { error: "Lookup failed" });
      return false;
    } finally {
      setResolving(false);
    }
  }

  async function advance(): Promise<boolean> {
    const idx = activeIdx();
    const opt = options[idx];
    if (!opt) return false;
    let slot = slots()[idx];
    if (opt.type === "user" && slot.raw && slot.resolved === null && !slot.error) {
      if (!(await resolveUserSlot(idx))) return false;
      slot = slots()[idx];
    }
    if (!slotSatisfied(opt, slot)) return false;
    if (idx + 1 >= options.length) return false;
    setActiveIdx(idx + 1);
    return true;
  }

  function submit() {
    const values: Record<string, unknown> = {};
    options.forEach((opt, i) => {
      values[opt.name] = slots()[i].resolved ?? opt.default ?? null;
    });
    props.onSubmit(values);
  }

  function flagMissingRequired() {
    setSlots((prev) =>
      prev.map((slot, i) =>
        options[i]?.required && slot.resolved === null && !slot.error
          ? { ...slot, error: "Required" }
          : slot,
      ),
    );
    clearTimeout(requiredFlashTimer);
    requiredFlashTimer = window.setTimeout(() => {
      requiredFlashTimer = undefined;
      setSlots((prev) =>
        prev.map((slot) => (slot.error === "Required" ? { ...slot, error: null } : slot)),
      );
    }, 1500);
  }

  function onActiveInput(e: InputEvent) {
    const value = (e.currentTarget as HTMLInputElement).value;
    const idx = activeIdx();
    const opt = options[idx];
    if (!opt) return;
    if (opt.type === "duration") {
      const n = value === "" ? null : parseDuration(value);
      patchSlot(idx, {
        raw: value, resolved: n, displayLabel: value,
        error: value !== "" && n === null ? `Try ${opt.hint ?? "30s, 5m, 1h"}` : null,
      });
    } else if (opt.type === "user") {
      patchSlot(idx, { raw: value, resolved: null, displayLabel: value, error: null });
    } else if (opt.type === "enum") {
      const allowed = opt.values ?? [];
      const exact = allowed.includes(value);
      patchSlot(idx, {
        raw: value,
        resolved: exact ? value : null,
        displayLabel: value,
        error: value !== "" && !exact ? `Must be one of: ${allowed.join(", ")}` : null,
      });
    } else {
      patchSlot(idx, {
        raw: value, displayLabel: value,
        resolved: value === "" ? null : value, error: null,
      });
    }
  }

  function selectUser(s: UserSuggestion) {
    fillUserSlot(activeIdx(), s.displayName, s.id, s.nickname ?? s.displayName);
    void advance();
  }

  function selectEnum(value: string) {
    patchSlot(activeIdx(), { raw: value, resolved: value, displayLabel: value, error: null });
    void advance();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (popupHandleKey?.(e)) return;

    if (e.key === "Escape") {
      e.preventDefault();
      props.onCancel();
      return;
    }
    if (resolving()) {
      if (e.key === "Tab" || e.key === "Enter") e.preventDefault();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit()) { submit(); return; }
      void (async () => {
        await advance();
        if (canSubmit()) submit();
        else flagMissingRequired();
      })();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      void advance();
      return;
    }
    if (e.key === "Backspace" && activeRaw() === "") {
      e.preventDefault();
      if (activeIdx() === 0) props.onCancel();
      else setActiveIdx(activeIdx() - 1);
    }
  }

  return (
    <div
      ref={composerRef}
      tabIndex={hasSlots ? undefined : -1}
      onKeyDown={hasSlots ? undefined : onKeyDown}
      class="relative flex-1 self-stretch flex flex-col min-w-0 outline-none"
    >
      <Show when={showUserPopup()}>
        <Suggestions<UserSuggestion>
          suggestions={userSuggestions}
          onSelect={selectUser}
          onDismiss={props.onCancel}
          renderItem={(s) => (
            <>
              <span
                class="font-semibold text-left truncate"
                style={{ color: s.color || "var(--color-text)" }}
              >
                {s.nickname ?? s.displayName}
              </span>
              <Show when={s.nickname}>
                <span class="text-text-muted text-sm truncate">({s.displayName})</span>
              </Show>
              <span class="flex-1" />
              <span class="text-xs font-semibold shrink-0 text-text-muted">
                {s.displayName.toLowerCase() !== s.login ? s.login : ""}
              </span>
            </>
          )}
          ref={(api) => { popupHandleKey = api.handleKey; }}
        />
      </Show>
      <Show when={showEnumPopup()}>
        <Suggestions<string>
          suggestions={enumSuggestions}
          onSelect={selectEnum}
          onDismiss={props.onCancel}
          renderItem={(v) => <span class="text-text">{v}</span>}
          ref={(api) => { popupHandleKey = api.handleKey; }}
        />
      </Show>
      <Banner tone={errorActive() ? "danger" : "info"}>
        <span class="text-text-muted">/{props.command.name}</span>
        <Show when={activeOption()?.name}>
          <span class="text-text-muted"> · </span>
          <span class={`font-semibold ${errorActive() ? "text-danger" : "text-primary"}`}>
            {activeOption()!.name}
          </span>
        </Show>
        <Show when={hintBody()}>
          <span class={errorActive() ? "text-danger" : "text-text-muted"}>
            {" — "}{hintBody()}
          </span>
        </Show>
      </Banner>
      <div class="flex items-center flex-wrap gap-2 px-4 min-h-14 py-2 min-w-0">
        <span class="inline-flex items-center px-2 py-1 rounded bg-primary/15 text-primary text-base font-semibold shrink-0">
          /{props.command.name}
        </span>
        <For each={options}>
          {(opt, i) => {
            const slot = () => slots()[i()];
            const active = () => i() === activeIdx();
            return (
              <CommandComposerSlot
                option={opt}
                raw={slot().raw}
                displayLabel={slot().displayLabel}
                isActive={active()}
                isFilled={slot().resolved !== null && !active()}
                errored={active() && !!slot().error}
                onActivate={() => setActiveIdx(i())}
                inputRef={(el) => { activeInput = el; }}
                onInput={onActiveInput}
                onKeyDown={onKeyDown}
              />
            );
          }}
        </For>
      </div>
    </div>
  );
}
