import { t, type MessageKey } from "../../../lib/i18n/index.ts";
import { CaseSensitive, Check, ChevronRight, Trash2 } from "lucide-solid";
import { Show } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import Card from "../../ui/Card.tsx";
import Toggle from "../../ui/Toggle.tsx";
import Textarea from "../../ui/Textarea.tsx";
import Field from "../../ui/Field.tsx";
import IconButton from "../../ui/IconButton.tsx";
import Segmented from "../../ui/Segmented.tsx";
import TriggerField from "./TriggerField.tsx";
import TriggerReplies from "./TriggerReplies.tsx";
import TriggerPreview from "./TriggerPreview.tsx";
import { autofocus } from "../../../lib/reactive/focus.ts";
import { isComplete } from "../../../lib/services/triggers.ts";
import {
  clampCooldown,
  MAX_TRIGGER_COOLDOWN,
  MIN_TRIGGER_COOLDOWN,
  sameTriggerSettings,
  type Trigger,
  TRIGGER_ROLES,
  type TriggerRole,
} from "../../../lib/stores/preferences.ts";

const ROLE_LABELS: Record<TriggerRole, MessageKey> = {
  everyone: "SETTINGS_TRIGGERS_ROLE_EVERYONE",
  subscriber: "SETTINGS_TRIGGERS_ROLE_SUBSCRIBER",
  vip: "SETTINGS_TRIGGERS_ROLE_VIP",
  moderator: "SETTINGS_TRIGGERS_ROLE_MODERATOR",
  broadcaster: "SETTINGS_TRIGGERS_ROLE_BROADCASTER",
};

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

  const dirty = () => !sameTriggerSettings(draft, props.source);
  const valid = () => isComplete(draft);
  const canSave = () => !props.persisted || dirty();

  return (
    <Card tone={canSave() ? "edited" : "plain"}>
      <div class="flex items-center gap-2 py-3 pl-4 pr-3">
        <Toggle
          label={t("SETTINGS_TRIGGERS_ENABLED")}
          checked={draft.enabled}
          onChange={(v) => setDraft("enabled", v)}
        />
        <Field
          look="inline"
          class="flex-1 min-w-0"
          ref={props.persisted ? undefined : autofocus}
          aria-label={t("SETTINGS_TRIGGERS_NAME")}
          placeholder={t("SETTINGS_TRIGGERS_UNTITLED")}
          value={draft.name}
          onInput={(e) => setDraft("name", e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !expanded()) props.onToggle();
          }}
        />
        <Show when={canSave()}>
          <IconButton
            variant="accent"
            label={
              valid()
                ? t("SETTINGS_TRIGGERS_SAVE")
                : t("SETTINGS_TRIGGERS_REQUIRED")
            }
            disabled={!valid()}
            onClick={() => props.onSave({ ...unwrap(draft) })}
          >
            <Check class="size-4" />
          </IconButton>
        </Show>
        <IconButton
          variant="danger"
          label={t("SETTINGS_TRIGGERS_DELETE")}
          onClick={props.onDelete}
        >
          <Trash2 class="size-4" />
        </IconButton>
        <IconButton
          label={
            expanded()
              ? t("SETTINGS_TRIGGERS_COLLAPSE")
              : t("SETTINGS_TRIGGERS_EXPAND")
          }
          aria-expanded={expanded()}
          onClick={props.onToggle}
        >
          <ChevronRight
            class={`size-4 transition-transform duration-quick ${
              expanded() ? "rotate-90" : ""
            }`}
          />
        </IconButton>
      </div>

      <Show when={expanded()}>
        <div class="flex flex-col gap-3 px-4 pb-4 enter-rise">
          <TriggerField label={t("SETTINGS_TRIGGERS_MATCH")}>
            <Textarea
              rows={2}
              resizable
              placeholder={t("SETTINGS_TRIGGERS_MATCH_PLACEHOLDER")}
              value={draft.phrase}
              onInput={(e) => setDraft("phrase", e.currentTarget.value)}
            />
            <div class="flex items-center gap-2">
              <Segmented
                label={t("SETTINGS_TRIGGERS_LOCATION")}
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
              <IconButton
                label={t("SETTINGS_TRIGGERS_CASE_SENSITIVE")}
                pressed={draft.caseSensitive}
                onClick={() => setDraft("caseSensitive", !draft.caseSensitive)}
              >
                <CaseSensitive class="size-4" />
              </IconButton>
            </div>
          </TriggerField>

          <TriggerField label={t("SETTINGS_TRIGGERS_RESPONSE")}>
            <TriggerReplies
              replies={draft.replies}
              otherwise={draft.otherwise}
              onRepliesChange={(replies) => setDraft("replies", replies)}
              onOtherwiseChange={(v) => setDraft("otherwise", v)}
            />
          </TriggerField>

          <TriggerField label={t("SETTINGS_TRIGGERS_ACTION")}>
            <div class="flex items-center gap-2">
              <Segmented
                label={t("SETTINGS_TRIGGERS_ACTION")}
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
              <span class="ml-auto text-small text-ink-soft">
                {t("SETTINGS_TRIGGERS_COOLDOWN")}
              </span>
              <Field
                type="number"
                aria-label={t("SETTINGS_TRIGGERS_COOLDOWN")}
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
                trailing={
                  <span class="text-small text-ink-soft">
                    {t("SETTINGS_TRIGGERS_SECONDS")}
                  </span>
                }
                class="w-28"
              />
            </div>
          </TriggerField>

          <TriggerField label={t("SETTINGS_TRIGGERS_ROLE")}>
            <div>
              <Segmented
                label={t("SETTINGS_TRIGGERS_ROLE")}
                value={draft.role}
                options={TRIGGER_ROLES.map((role) => ({
                  value: role,
                  label: t(ROLE_LABELS[role]),
                }))}
                onChange={(v) => setDraft("role", v)}
              />
            </div>
          </TriggerField>

          <TriggerField label={t("SETTINGS_TRIGGERS_TRY")}>
            <TriggerPreview trigger={draft} />
          </TriggerField>
        </div>
      </Show>
    </Card>
  );
}
