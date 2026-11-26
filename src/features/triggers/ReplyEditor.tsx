import { Index, Show } from "solid-js";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-solid";
import Button from "../../kit/Button.tsx";
import IconButton from "../../kit/IconButton.tsx";
import ConditionRow from "./ConditionRow.tsx";
import Lead from "./ui/Lead.tsx";
import ResponseField, { type Targeting } from "./ui/ResponseField.tsx";
import {
  addCondition,
  addGroup,
  removeCondition,
  updateCondition,
} from "./conditionGroups.ts";
import type { Condition, ConditionalReply } from "../preferences/index.ts";
import { t } from "../../shared/i18n/index.ts";
import Text from "../../kit/Text.tsx";
import Divider from "../../kit/Divider.tsx";

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
    <div class="flex items-center gap-2">
      <Text size="sm" bold tone="soft">
        {t("SETTINGS_TRIGGERS_JOIN_OR_VALUE")}
      </Text>
      <Divider strong class="flex-1" />
    </div>
  );
}

export default function ReplyEditor(props: Props) {
  const groups = () => props.reply.when;
  const setGroups = (next: Condition[][]) =>
    props.onChange({ ...props.reply, when: next });
  const removable = () => groups().flat().length > 1;

  return (
    <div class="flex flex-col gap-2 pl-3 border-l-2 border-line enter-rise">
      <div class="flex items-center gap-1">
        <Text size="sm" bold tone="soft" class="flex-1">
          {t("SETTINGS_TRIGGERS_REPLY_NUMBER_LABEL", { number: props.number })}
        </Text>
        <IconButton
          label={t("UI_MOVE_UP_LABEL")}
          disabled={props.first}
          onClick={() => props.onMove(-1)}
        >
          <ArrowUp class="size-4" />
        </IconButton>
        <IconButton
          label={t("UI_MOVE_DOWN_LABEL")}
          disabled={props.last}
          onClick={() => props.onMove(1)}
        >
          <ArrowDown class="size-4" />
        </IconButton>
        <IconButton
          label={t("SETTINGS_TRIGGERS_REMOVE_REPLY_LABEL")}
          tip={false}
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
                <ConditionRow
                  lead={
                    at === 0
                      ? t("SETTINGS_TRIGGERS_IF_LABEL")
                      : t("SETTINGS_TRIGGERS_JOIN_AND_VALUE")
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
                {t("SETTINGS_TRIGGERS_ADD_AND_LABEL")}
              </Button>
              <Show when={g === groups().length - 1}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plus class="size-4" />}
                  onClick={() => setGroups(addGroup(groups()))}
                >
                  {t("SETTINGS_TRIGGERS_ADD_OR_LABEL")}
                </Button>
              </Show>
            </div>
          </>
        )}
      </Index>
      <div class="flex items-start gap-2">
        <Lead>{t("SETTINGS_TRIGGERS_THEN_LABEL")}</Lead>
        <ResponseField
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
