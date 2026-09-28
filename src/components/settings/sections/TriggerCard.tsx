import { Check, ChevronRight, Trash2 } from "lucide-solid";
import { createSignal, type JSX, Show } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import Toggle from "../../ui/Toggle.tsx";
import Field from "../../ui/Field.tsx";
import Button from "../../ui/Button.tsx";
import Segmented from "../../ui/Segmented.tsx";
import {
  clampCooldown,
  MAX_TRIGGER_COOLDOWN,
  MIN_TRIGGER_COOLDOWN,
  type Trigger,
} from "../../../lib/stores/preferences.ts";

function SectionLabel(props: { children: string }) {
  return <span class="text-small text-ink-faint">{props.children}</span>;
}

function Row(props: { label: string; children: JSX.Element }) {
  return (
    <div class="flex items-center gap-3">
      <span class="w-24 shrink-0 text-small text-ink-soft">{props.label}</span>
      <div>{props.children}</div>
    </div>
  );
}

export default function TriggerCard(props: {
  source: Trigger;
  persisted: boolean;
  onSave: (trigger: Trigger) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = createStore<Trigger>({ ...props.source });
  const [expanded, setExpanded] = createSignal(!props.persisted);

  const dirty = () => JSON.stringify(draft) !== JSON.stringify(props.source);
  const valid = () =>
    !!draft.name.trim() && !!draft.phrase.trim() && !!draft.response.trim();
  const canSave = () => !props.persisted || dirty();

  return (
    <div
      class={`flex flex-col gap-4 rounded-lg border bg-surface p-4 transition-opacity duration-snap ${
        canSave() ? "border-accent/40" : "border-line-soft"
      } ${draft.enabled ? "" : "opacity-60"}`}
    >
      <div class="flex items-center gap-3">
        <Toggle
          checked={draft.enabled}
          onChange={(v) => setDraft("enabled", v)}
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          class="flex-1 flex items-center gap-2 min-w-0 cursor-pointer text-left group"
        >
          <span
            class={`flex-1 truncate text-body font-semibold min-w-0 ${
              draft.enabled ? "text-ink" : "text-ink-soft"
            }`}
          >
            {draft.name.trim() || "Untitled trigger"}
            <Show when={canSave()}>
              <span class="text-accent-ink ml-1">*</span>
            </Show>
          </span>
          <ChevronRight
            class={`size-4 shrink-0 text-ink-soft transition-transform duration-quick group-hover:text-ink ${
              expanded() ? "rotate-90" : ""
            }`}
          />
        </button>
        <Show when={canSave()}>
          <Button
            variant="accent"
            icon={<Check class="size-4" />}
            title={valid()
              ? "Save trigger"
              : "Name, phrase and response are required"}
            disabled={!valid()}
            onClick={() => props.onSave({ ...unwrap(draft) })}
          />
        </Show>
        <Button
          variant="danger"
          icon={<Trash2 class="size-4" />}
          title="Delete trigger"
          onClick={props.onDelete}
        />
      </div>

      <Show when={expanded()}>
        <div class="flex flex-col gap-4">
          <div class="h-px -mx-4 bg-line-soft" />

          <div class="flex flex-col gap-3">
            <SectionLabel>Name</SectionLabel>
            <Field
              placeholder="Trigger name..."
              value={draft.name}
              onInput={(e) => setDraft("name", e.currentTarget.value)}
            />
          </div>

          <div class="flex flex-col gap-3">
            <SectionLabel>Match</SectionLabel>
            <textarea
              rows={2}
              placeholder="Phrases to match, one per line..."
              value={draft.phrase}
              onInput={(e) => setDraft("phrase", e.currentTarget.value)}
              class="bg-surface text-ink text-body rounded-sm px-3 py-2 border border-line hover:border-ink-faint focus:outline-none focus:border-accent resize-y placeholder:text-ink-faint transition-colors duration-snap"
            />
            <Row label="Location">
              <Segmented
                value={draft.location}
                options={[
                  { value: "start", label: "Start" },
                  { value: "exact", label: "Exact" },
                  { value: "anywhere", label: "Anywhere" },
                ]}
                onChange={(v) => setDraft("location", v)}
              />
            </Row>
            <Row label="Case sensitive">
              <Toggle
                checked={draft.caseSensitive}
                onChange={(v) => setDraft("caseSensitive", v)}
              />
            </Row>
          </div>

          <div class="flex flex-col gap-3">
            <SectionLabel>Response</SectionLabel>
            <Field
              placeholder="Response message..."
              value={draft.response}
              onInput={(e) => setDraft("response", e.currentTarget.value)}
            />
            <Row label="Action">
              <Segmented
                value={draft.action}
                options={[
                  { value: "reply", label: "Reply" },
                  { value: "send", label: "Send" },
                ]}
                onChange={(v) => setDraft("action", v)}
              />
            </Row>
            <Row label="Cooldown">
              <div class="flex items-center gap-2">
                <Field
                  type="number"
                  min={MIN_TRIGGER_COOLDOWN}
                  max={MAX_TRIGGER_COOLDOWN}
                  value={draft.cooldown}
                  onInput={(e) => {
                    const n = parseInt(e.currentTarget.value, 10);
                    setDraft("cooldown", Number.isFinite(n) ? n : 0);
                  }}
                  onBlur={() =>
                    setDraft("cooldown", clampCooldown(draft.cooldown))}
                  class="w-20"
                />
                <span class="text-small text-ink-soft">seconds</span>
              </div>
            </Row>
          </div>
        </div>
      </Show>
    </div>
  );
}
