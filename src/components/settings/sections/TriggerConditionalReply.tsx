import { Index, Show } from "solid-js";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-solid";
import Button from "../../ui/Button.tsx";
import IconButton from "../../ui/IconButton.tsx";
import TriggerConditionRow from "./TriggerConditionRow.tsx";
import TriggerLead from "./TriggerLead.tsx";
import TriggerResponseField, {
  type Targeting,
} from "./TriggerResponseField.tsx";
import {
  addCondition,
  addGroup,
  removeCondition,
  updateCondition,
} from "../../../lib/services/conditionGroups.ts";
import type {
  Condition,
  ConditionalReply,
} from "../../../lib/stores/preferences.ts";
import { t } from "../../../lib/i18n/index.ts";

type Props = Targeting & {
  reply: ConditionalReply;
  number: number;
  first: boolean;
  last: boolean;
  onChange: (reply: ConditionalReply) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
};

function OrDivider() {
  return (
    <div class="flex items-center gap-2 text-small font-semibold text-ink-soft">
      {t("SETTINGS_TRIGGERS_JOIN_OR")}
      <span class="flex-1 border-t border-line" />
    </div>
  );
}

export default function TriggerConditionalReply(props: Props) {
  const groups = () => props.reply.when;
  const setGroups = (next: Condition[][]) =>
    props.onChange({ ...props.reply, when: next });
  const removable = () => groups().flat().length > 1;

  return (
    <div class="flex flex-col gap-2 pl-3 border-l-2 border-line enter-rise">
      <div class="flex items-center gap-1">
        <span class="flex-1 text-small font-semibold text-ink-soft">
          {t("SETTINGS_TRIGGERS_REPLY_NUMBER", { number: props.number })}
        </span>
        <IconButton
          label={t("UI_MOVE_UP")}
          disabled={props.first}
          onClick={() => props.onMove(-1)}
        >
          <ArrowUp class="size-4" />
        </IconButton>
        <IconButton
          label={t("UI_MOVE_DOWN")}
          disabled={props.last}
          onClick={() => props.onMove(1)}
        >
          <ArrowDown class="size-4" />
        </IconButton>
        <IconButton
          label={t("SETTINGS_TRIGGERS_REMOVE_REPLY")}
          onClick={props.onRemove}
        >
          <Trash2 class="size-4" />
        </IconButton>
      </div>
      <Index each={groups()}>
        {(group, g) => (
          <>
            <Show when={g > 0}>
              <OrDivider />
            </Show>
            <Index each={group()}>
              {(condition, at) => (
                <TriggerConditionRow
                  lead={
                    at === 0
                      ? t("SETTINGS_TRIGGERS_IF")
                      : t("SETTINGS_TRIGGERS_JOIN_AND")
                  }
                  condition={condition()}
                  removable={removable()}
                  onChange={(next) =>
                    setGroups(updateCondition(groups(), g, at, next))
                  }
                  onRemove={() => setGroups(removeCondition(groups(), g, at))}
                  onActivate={props.onActivate}
                  onRelease={props.onRelease}
                />
              )}
            </Index>
            <div class="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus class="size-4" />}
                onClick={() => setGroups(addCondition(groups(), g))}
              >
                {t("SETTINGS_TRIGGERS_ADD_AND")}
              </Button>
              <Show when={g === groups().length - 1}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plus class="size-4" />}
                  onClick={() => setGroups(addGroup(groups()))}
                >
                  {t("SETTINGS_TRIGGERS_ADD_OR")}
                </Button>
              </Show>
            </div>
          </>
        )}
      </Index>
      <div class="flex items-start gap-2">
        <TriggerLead>{t("SETTINGS_TRIGGERS_THEN")}</TriggerLead>
        <TriggerResponseField
          value={props.reply.text}
          placeholder={t("SETTINGS_TRIGGERS_REPLY_PLACEHOLDER")}
          onChange={(text) => props.onChange({ ...props.reply, text })}
          onActivate={props.onActivate}
          onRelease={props.onRelease}
        />
      </div>
    </div>
  );
}
