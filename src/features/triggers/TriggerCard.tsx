import { t, type MessageKey } from "../../shared/i18n/index.ts";
import { CaseSensitive, Check, ChevronRight, Trash2 } from "lucide-solid";
import { Show } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import Card from "../../kit/Card.tsx";
import Toggle from "../../kit/Toggle.tsx";
import Textarea from "../../kit/Textarea.tsx";
import Field from "../../kit/Field.tsx";
import IconButton from "../../kit/IconButton.tsx";
import Segmented from "../../kit/Segmented.tsx";
import TriggerField from "./TriggerField.tsx";
import Replies from "./Replies.tsx";
import TriggerPreview from "./TriggerPreview.tsx";
import { autofocus } from "../../shared/solid/focus.ts";
import { isComplete } from "./store.ts";
import {
  clampCooldown,
  MAX_TRIGGER_COOLDOWN,
  MIN_TRIGGER_COOLDOWN,
  type Trigger,
  TRIGGER_ROLES,
  type TriggerRole,
} from "../preferences/index.ts";
import { sameTriggerSettings } from "./saved.ts";

const ROLE_LABELS: Record<TriggerRole, MessageKey> = {
  everyone: "SETTINGS_TRIGGERS_ROLE_EVERYONE_LABEL",
  subscriber: "SETTINGS_TRIGGERS_ROLE_SUBSCRIBER_LABEL",
  vip: "SETTINGS_TRIGGERS_ROLE_VIP_LABEL",
  moderator: "SETTINGS_TRIGGERS_ROLE_MODERATOR_LABEL",
  broadcaster: "SETTINGS_TRIGGERS_ROLE_BROADCASTER_LABEL",
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
          label={t("SETTINGS_TRIGGERS_ENABLED_LABEL")}
          checked={draft.enabled}
          onChange={(v) => setDraft("enabled", v)}
        />
        <Field
          look="inline"
          class="flex-1 min-w-0"
          ref={props.persisted ? undefined : autofocus}
          aria-label={t("SETTINGS_TRIGGERS_NAME_LABEL")}
          placeholder={t("SETTINGS_TRIGGERS_NAME_PLACEHOLDER")}
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
                ? t("SETTINGS_TRIGGERS_SAVE_LABEL")
                : t("SETTINGS_TRIGGERS_REQUIRED_ERROR")
            }
            disabled={!valid()}
            onClick={() => props.onSave({ ...unwrap(draft) })}
          >
            <Check class="size-4" />
          </IconButton>
        </Show>
        <IconButton
          variant="danger"
          label={t("SETTINGS_TRIGGERS_DELETE_LABEL")}
          onClick={props.onDelete}
        >
          <Trash2 class="size-4" />
        </IconButton>
        <IconButton
          label={
            expanded()
              ? t("SETTINGS_TRIGGERS_COLLAPSE_LABEL")
              : t("SETTINGS_TRIGGERS_EXPAND_LABEL")
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
          <TriggerField label={t("SETTINGS_TRIGGERS_PHRASE_LABEL")}>
            <Textarea
              rows={2}
              resizable
              placeholder={t("SETTINGS_TRIGGERS_PHRASE_PLACEHOLDER")}
              value={draft.phrase}
              onInput={(e) => setDraft("phrase", e.currentTarget.value)}
            />
            <div class="flex items-center gap-2">
              <Segmented
                label={t("SETTINGS_TRIGGERS_LOCATION_LABEL")}
                value={draft.location}
                options={[
                  {
                    value: "start",
                    label: t("SETTINGS_TRIGGERS_LOCATION_START_LABEL"),
                  },
                  {
                    value: "exact",
                    label: t("SETTINGS_TRIGGERS_LOCATION_EXACT_LABEL"),
                  },
                  {
                    value: "anywhere",
                    label: t("SETTINGS_TRIGGERS_LOCATION_ANYWHERE_LABEL"),
                  },
                ]}
                onChange={(v) => setDraft("location", v)}
              />
              <IconButton
                label={t("SETTINGS_TRIGGERS_CASE_SENSITIVE_LABEL")}
                pressed={draft.caseSensitive}
                onClick={() => setDraft("caseSensitive", !draft.caseSensitive)}
              >
                <CaseSensitive class="size-4" />
              </IconButton>
            </div>
          </TriggerField>

          <TriggerField label={t("SETTINGS_TRIGGERS_REPLY_LABEL")}>
            <Replies
              replies={draft.replies}
              otherwise={draft.otherwise}
              onRepliesChange={(replies) => setDraft("replies", replies)}
              onOtherwiseChange={(v) => setDraft("otherwise", v)}
            />
          </TriggerField>

          <TriggerField label={t("SETTINGS_TRIGGERS_ACTION_LABEL")}>
            <div class="flex items-center gap-2">
              <Segmented
                label={t("SETTINGS_TRIGGERS_ACTION_LABEL")}
                value={draft.action}
                options={[
                  {
                    value: "reply",
                    label: t("SETTINGS_TRIGGERS_ACTION_REPLY_LABEL"),
                  },
                  {
                    value: "send",
                    label: t("SETTINGS_TRIGGERS_ACTION_SEND_LABEL"),
                  },
                ]}
                onChange={(v) => setDraft("action", v)}
              />
              <span class="ml-auto text-small text-ink-soft">
                {t("SETTINGS_TRIGGERS_COOLDOWN_LABEL")}
              </span>
              <Field
                type="number"
                aria-label={t("SETTINGS_TRIGGERS_COOLDOWN_LABEL")}
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
                    {t("SETTINGS_TRIGGERS_SECONDS_VALUE")}
                  </span>
                }
                class="w-28"
              />
            </div>
          </TriggerField>

          <TriggerField label={t("SETTINGS_TRIGGERS_ROLE_LABEL")}>
            <div>
              <Segmented
                label={t("SETTINGS_TRIGGERS_ROLE_LABEL")}
                value={draft.role}
                options={TRIGGER_ROLES.map((role) => ({
                  value: role,
                  label: t(ROLE_LABELS[role]),
                }))}
                onChange={(v) => setDraft("role", v)}
              />
            </div>
          </TriggerField>

          <TriggerField label={t("SETTINGS_TRIGGERS_TRY_LABEL")}>
            <TriggerPreview trigger={draft} />
          </TriggerField>
        </div>
      </Show>
    </Card>
  );
}
