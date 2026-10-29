import { createEffect, createMemo, For, type JSX, Show } from "solid-js";
import type { Command, CommandContext, OptionSuggestion } from "./types.ts";
import Suggestions from "../suggestions/Suggestions.tsx";
import ChatterRow from "../suggestions/ChatterRow.tsx";
import type { Chatter } from "../../lib/types/index.ts";
import Artwork from "../ui/Artwork.tsx";
import ComposerBox from "../ui/ComposerBox.tsx";
import CommandComposerSlot from "./CommandComposerSlot.tsx";
import { createCommandComposer } from "./createCommandComposer.ts";

type Popup = {
  items: () => unknown[];
  select: (item: unknown) => void;
  render: (item: unknown) => JSX.Element;
};

function renderSearchItem(s: OptionSuggestion): JSX.Element {
  return (
    <>
      <Show when={s.image}>
        {(image) => <Artwork src={image()} shape="boxart" fit="inline" />}
      </Show>
      <span class="text-ink truncate">{s.label}</span>
    </>
  );
}

type Props = {
  command: Command;
  ctx: CommandContext;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
};

export default function CommandComposer(props: Props) {
  const composer = createCommandComposer(props);
  const { options, hasSlots, slotAt, activeIdx, activeOption } = composer;
  let activeInput: HTMLInputElement | undefined;
  let composerRef: HTMLDivElement | undefined;
  let popupHandleKey: ((e: KeyboardEvent) => boolean) | undefined;

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

  const activePopup = createMemo<Popup | null>(() => {
    switch (activeOption()?.type) {
      case "user":
        return composer.userSuggestions().length === 0
          ? null
          : {
              items: composer.userSuggestions,
              select: (i) => {
                const c = i as Chatter;
                composer.choose(c.displayName, c.id);
              },
              render: (i) => <ChatterRow chatter={i as Chatter} />,
            };
      case "enum":
        return composer.enumSuggestions().length === 0
          ? null
          : {
              items: composer.enumSuggestions,
              select: (i) => composer.choose(i as string, i),
              render: (i) => <span class="text-ink">{i as string}</span>,
            };
      case "search":
        return composer.searchSuggestions().length === 0
          ? null
          : {
              items: composer.searchSuggestions,
              select: (i) => {
                const s = i as OptionSuggestion;
                composer.choose(s.label, s);
              },
              render: (i) => renderSearchItem(i as OptionSuggestion),
            };
      default:
        return null;
    }
  });

  function onKeyDown(e: KeyboardEvent) {
    if (popupHandleKey?.(e)) return;
    composer.handleKey(e);
  }

  return (
    <div
      ref={composerRef}
      tabIndex={hasSlots ? undefined : -1}
      onKeyDown={hasSlots ? undefined : onKeyDown}
      class="relative flex flex-col min-w-0 outline-none"
    >
      <Show when={activePopup()}>
        <Suggestions<unknown>
          suggestions={() => activePopup()?.items() ?? []}
          onSelect={(i) => activePopup()?.select(i)}
          onDismiss={props.onCancel}
          renderItem={(i) => <>{activePopup()?.render(i)}</>}
          ref={(api) => {
            popupHandleKey = api.handleKey;
          }}
        />
      </Show>
      <div class="flex items-center gap-2 px-1 pb-2 text-small text-ink-soft min-w-0">
        <span class="truncate">
          /{props.command.name}
          <Show when={activeOption()?.name}>
            {(name) => (
              <>
                {" · "}
                <span
                  class={`font-semibold ${
                    composer.errorActive() ? "text-negative" : "text-accent-ink"
                  }`}
                >
                  {name()}
                </span>
              </>
            )}
          </Show>
          <Show when={composer.hint()}>
            <span class={composer.errorActive() ? "text-negative" : ""}>
              {" — "}
              {composer.hint()}
            </span>
          </Show>
        </span>
      </div>
      <ComposerBox>
        <div class="flex-1 self-center flex items-center flex-wrap gap-2 min-h-9 py-0.5 min-w-0">
          <span class="inline-flex items-center px-2 py-1 rounded-sm bg-accent-soft text-accent-ink text-body font-semibold shrink-0">
            /{props.command.name}
          </span>
          <For each={options}>
            {(opt, i) => {
              const slot = () => slotAt(i());
              const active = () => i() === activeIdx();
              return (
                <CommandComposerSlot
                  option={opt}
                  raw={slot().raw}
                  displayLabel={slot().displayLabel}
                  isActive={active()}
                  isFilled={slot().resolved !== null && !active()}
                  errored={active() && !!slot().error}
                  onActivate={() => composer.setActiveIdx(i())}
                  inputRef={(el) => {
                    activeInput = el;
                  }}
                  onInput={(e) =>
                    composer.input((e.currentTarget as HTMLInputElement).value)
                  }
                  onKeyDown={onKeyDown}
                />
              );
            }}
          </For>
        </div>
      </ComposerBox>
    </div>
  );
}
