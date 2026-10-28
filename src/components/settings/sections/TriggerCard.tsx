import { t } from "../../../lib/i18n/index.ts";
import { Check, ChevronRight, Trash2 } from "lucide-solid";
import { Show } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import Toggle from "../../ui/Toggle.tsx";
import Textarea from "../../ui/Textarea.tsx";
import Field from "../../ui/Field.tsx";
import Button from "../../ui/Button.tsx";
import Segmented from "../../ui/Segmented.tsx";
import TriggerField from "./TriggerField.tsx";
import TriggerSectionLabel from "./TriggerSectionLabel.tsx";
import {
  clampCooldown,
  MAX_TRIGGER_COOLDOWN,
  MIN_TRIGGER_COOLDOWN,
  type Trigger,
} from "../../../lib/stores/preferences.ts";

export default function TriggerCard(props: {
  source: Trigger;
  persisted: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSave: (trigger: Trigger) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = createStore<Trigger>({ ...props.source });
  const expanded = () => props.expanded;

  const dirty = () => JSON.stringify(draft) !== JSON.stringify(props.source);
  const valid = () =>
    !!draft.name.trim() && !!draft.phrase.trim() && !!draft.response.trim();
  const canSave = () => !props.persisted || dirty();

  return (
    <div
      class={`flex flex-col gap-4 rounded-lg border bg-surface p-4 ${
        canSave() ? "border-accent/40" : "border-line-soft"
      }`}
    >
      <div class="flex items-center gap-3">
        <Toggle
          label={t("SETTINGS_TRIGGERS_ENABLED")}
          checked={draft.enabled}
          onChange={(v) => setDraft("enabled", v)}
        />
        <button
          type="button"
          onClick={props.onToggle}
          class="flex-1 flex items-center gap-2 min-w-0 cursor-pointer text-left group"
        >
          <span
            class={`flex-1 truncate text-body font-semibold min-w-0 ${
              draft.enabled ? "text-ink" : "text-ink-soft"
            }`}
          >
            {draft.name.trim() || t("SETTINGS_TRIGGERS_UNTITLED")}
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
            data-tip={
              valid()
                ? t("SETTINGS_TRIGGERS_SAVE")
                : t("SETTINGS_TRIGGERS_REQUIRED")
            }
            disabled={!valid()}
            onClick={() => props.onSave({ ...unwrap(draft) })}
          />
        </Show>
        <Button
          variant="danger"
          icon={<Trash2 class="size-4" />}
          data-tip={t("SETTINGS_TRIGGERS_DELETE")}
          onClick={props.onDelete}
        />
      </div>

      <Show when={expanded()}>
        <div class="flex flex-col gap-4">
          <div class="h-px -mx-4 bg-line-soft" />

          <div class="flex flex-col gap-3">
            <TriggerSectionLabel>
              {t("SETTINGS_TRIGGERS_NAME")}
            </TriggerSectionLabel>
            <Field
              placeholder={t("SETTINGS_TRIGGERS_NAME_PLACEHOLDER")}
              value={draft.name}
              onInput={(e) => setDraft("name", e.currentTarget.value)}
            />
          </div>

          <div class="flex flex-col gap-3">
            <TriggerSectionLabel>
              {t("SETTINGS_TRIGGERS_MATCH")}
            </TriggerSectionLabel>
            <Textarea
              rows={2}
              resizable
              placeholder={t("SETTINGS_TRIGGERS_MATCH_PLACEHOLDER")}
              value={draft.phrase}
              onInput={(e) => setDraft("phrase", e.currentTarget.value)}
            />
            <TriggerField label={t("SETTINGS_TRIGGERS_LOCATION")}>
              <Segmented
                value={draft.location}
                options={[
                  {
                    value: "start",
                    label: t("SETTINGS_TRIGGERS_LOCATION_START"),
                  },
                  {
                    value: "exact",
                    label: t("SETTINGS_TRIGGERS_LOCATION_EXACT"),
                  },
                  {
                    value: "anywhere",
                    label: t("SETTINGS_TRIGGERS_LOCATION_ANYWHERE"),
                  },
                ]}
                onChange={(v) => setDraft("location", v)}
              />
            </TriggerField>
            <TriggerField label={t("SETTINGS_TRIGGERS_CASE_SENSITIVE")}>
              <Toggle
                label={t("SETTINGS_TRIGGERS_CASE_SENSITIVE")}
                checked={draft.caseSensitive}
                onChange={(v) => setDraft("caseSensitive", v)}
              />
            </TriggerField>
          </div>

          <div class="flex flex-col gap-3">
            <TriggerSectionLabel>
              {t("SETTINGS_TRIGGERS_RESPONSE")}
            </TriggerSectionLabel>
            <Field
              placeholder={t("SETTINGS_TRIGGERS_RESPONSE_PLACEHOLDER")}
              value={draft.response}
              onInput={(e) => setDraft("response", e.currentTarget.value)}
            />
            <TriggerField label={t("SETTINGS_TRIGGERS_ACTION")}>
              <Segmented
                value={draft.action}
                options={[
                  {
                    value: "reply",
                    label: t("SETTINGS_TRIGGERS_ACTION_REPLY"),
                  },
                  { value: "send", label: t("SETTINGS_TRIGGERS_ACTION_SEND") },
                ]}
                onChange={(v) => setDraft("action", v)}
              />
            </TriggerField>
            <TriggerField label={t("SETTINGS_TRIGGERS_COOLDOWN")}>
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
                    setDraft("cooldown", clampCooldown(draft.cooldown))
                  }
                  class="w-20"
                />
                <span class="text-small text-ink-soft">
                  {t("SETTINGS_TRIGGERS_SECONDS")}
                </span>
              </div>
            </TriggerField>
          </div>
        </div>
      </Show>
    </div>
  );
}
