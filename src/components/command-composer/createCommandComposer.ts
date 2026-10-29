import { createMemo, createResource, createSignal, onCleanup } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { chattersIn } from "../../lib/stores/users.ts";
import * as users from "../../lib/services/users.ts";
import { rankChatters } from "../../lib/utils/rankChatters.ts";
import { at } from "../../lib/utils/at.ts";
import { createDebounced } from "../../lib/reactive/createDebounced.ts";
import type { Chatter } from "../../lib/types/index.ts";
import type { Command, CommandContext, OptionSuggestion } from "./types.ts";
import {
  allSatisfied,
  chosenSlot,
  emptySlot,
  enumMatches,
  invalid,
  type Slot,
  slotErrorText,
  slotFromInput,
  slotSatisfied,
  valuesOf,
  withoutRequiredFlags,
  withRequiredFlagged,
} from "./parse.ts";

const SEARCH_DEBOUNCE_MS = 250;
const REQUIRED_FLASH_MS = 1500;

type Options = {
  command: Command;
  ctx: CommandContext;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
};

export function createCommandComposer(opts: Options) {
  const options = opts.command.options;
  const hasSlots = options.length > 0;
  const [slots, setSlots] = createSignal<Slot[]>(options.map(emptySlot));
  const [activeIdx, setActiveIdx] = createSignal(0);
  const [resolving, setResolving] = createSignal(false);
  let requiredFlashTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(requiredFlashTimer));

  const slotAt = (i: number) => at(slots(), i);
  const activeOption = () => options[activeIdx()] ?? null;
  const activeSlot = () => slots()[activeIdx()];
  const activeRaw = () => activeSlot()?.raw ?? "";
  const awaitingChoice = () => activeSlot()?.resolved === null;

  function setSlot(idx: number, slot: Slot) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? slot : s)));
  }

  function markInvalid(idx: number, message: string) {
    setSlot(idx, { ...slotAt(idx), error: invalid(message) });
  }

  const userSuggestions = createMemo<Chatter[]>(() =>
    activeOption()?.type === "user" && awaitingChoice()
      ? rankChatters(chattersIn(opts.ctx.broadcasterId), activeRaw())
      : [],
  );

  const enumSuggestions = createMemo<string[]>(() => {
    const opt = activeOption();
    return opt?.type === "enum" && awaitingChoice()
      ? enumMatches(opt.values, activeRaw())
      : [];
  });

  const searchQuery = createDebounced(
    () => (activeOption()?.type === "search" ? activeRaw().trim() : ""),
    SEARCH_DEBOUNCE_MS,
  );
  const [searchResults] = createResource(searchQuery, async (q) => {
    const opt = activeOption();
    if (!q || opt?.type !== "search") return [];
    return await opt.search(q).catch(() => []);
  });
  const searchSuggestions = createMemo<OptionSuggestion[]>(() =>
    activeOption()?.type === "search" && awaitingChoice()
      ? (searchResults() ?? [])
      : [],
  );

  const errorActive = createMemo(() => !!activeSlot()?.error);

  const hint = createMemo(() => {
    if (resolving()) {
      return activeOption()?.type === "search"
        ? t("COMMAND_SEARCHING")
        : t("COMMAND_LOOKING_UP_USER");
    }
    const opt = activeOption();
    const slot = activeSlot();
    if (!opt || !slot) return hasSlots ? "" : t(opts.command.description);
    if (slot.error) return slotErrorText(slot.error);
    const base = t(opt.hint ?? opt.description);
    return opt.required && slot.resolved === null
      ? t("COMMAND_REQUIRED_HINT", { hint: base })
      : base;
  });

  async function resolveUser(idx: number): Promise<boolean> {
    const login = slotAt(idx).raw.replace(/^@/, "").trim().toLowerCase();
    if (!login) return false;
    setResolving(true);
    const lookup = await users.findByLogin(login, { silent: true });
    setResolving(false);
    if (lookup.status === "found") {
      setSlot(idx, chosenSlot(lookup.user.displayName, lookup.user.id));
      return true;
    }
    markInvalid(
      idx,
      lookup.status === "missing"
        ? t("COMMAND_USER_NOT_FOUND", { login })
        : t("COMMAND_LOOKUP_FAILED"),
    );
    return false;
  }

  async function resolveSearch(idx: number): Promise<boolean> {
    const opt = options[idx];
    const query = slotAt(idx).raw.trim();
    if (opt?.type !== "search" || !query) return false;
    setResolving(true);
    const matches = await opt.search(query).catch(() => null);
    setResolving(false);
    const match = matches?.[0];
    if (!match) {
      markInvalid(
        idx,
        matches ? t("COMMAND_NO_MATCH", { query }) : t("COMMAND_LOOKUP_FAILED"),
      );
      return false;
    }
    setSlot(idx, chosenSlot(match.label, match));
    return true;
  }

  async function resolvePending(idx: number): Promise<boolean> {
    const slot = slotAt(idx);
    if (!slot.raw || slot.resolved !== null || slot.error) return true;
    const type = options[idx]?.type;
    if (type === "user") return await resolveUser(idx);
    if (type === "search") return await resolveSearch(idx);
    return true;
  }

  async function advance(): Promise<boolean> {
    const idx = activeIdx();
    const opt = options[idx];
    if (!opt || !(await resolvePending(idx))) return false;
    if (!slotSatisfied(opt, slotAt(idx))) return false;
    if (idx + 1 >= options.length) return false;
    setActiveIdx(idx + 1);
    return true;
  }

  function flagMissingRequired() {
    setSlots((prev) => withRequiredFlagged(options, prev));
    clearTimeout(requiredFlashTimer);
    requiredFlashTimer = setTimeout(() => {
      requiredFlashTimer = undefined;
      setSlots(withoutRequiredFlags);
    }, REQUIRED_FLASH_MS);
  }

  async function trySubmit() {
    if (!allSatisfied(options, slots())) {
      for (let i = 0; i < options.length; i++) await resolvePending(i);
    }
    if (allSatisfied(options, slots())) {
      opts.onSubmit(valuesOf(options, slots()));
      return;
    }
    await advance();
    flagMissingRequired();
  }

  function input(value: string) {
    const opt = activeOption();
    if (opt) setSlot(activeIdx(), slotFromInput(opt, value));
  }

  function choose(label: string, resolved: unknown) {
    setSlot(activeIdx(), chosenSlot(label, resolved));
    void advance();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      opts.onCancel();
      return;
    }
    if (resolving()) {
      if (e.key === "Tab" || e.key === "Enter") e.preventDefault();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void trySubmit();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      void advance();
      return;
    }
    if (e.key === "Backspace" && activeRaw() === "") {
      e.preventDefault();
      if (activeIdx() === 0) opts.onCancel();
      else setActiveIdx(activeIdx() - 1);
    }
  }

  return {
    options,
    hasSlots,
    slotAt,
    activeIdx,
    setActiveIdx,
    activeOption,
    errorActive,
    hint,
    userSuggestions,
    enumSuggestions,
    searchSuggestions,
    input,
    choose,
    handleKey,
  };
}
