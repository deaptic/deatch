import { Show } from "solid-js";
import { ListFilter, X } from "lucide-solid";
import IconButton from "../../ui/IconButton.tsx";
import MenuItem from "../../ui/MenuItem.tsx";
import PopoverButton from "../../ui/PopoverButton.tsx";
import TriggerLead from "./TriggerLead.tsx";
import TriggerResponseField, {
  type Targeting,
} from "./TriggerResponseField.tsx";
import { needsValue } from "../../../lib/services/triggerConditions.ts";
import {
  type Condition,
  CONDITION_OPS,
  type ConditionOp,
} from "../../../lib/stores/preferences.ts";
import { type MessageKey, t } from "../../../lib/i18n/index.ts";

const OP_LABELS: Record<ConditionOp, MessageKey> = {
  set: "SETTINGS_TRIGGERS_OP_SET_LABEL",
  empty: "SETTINGS_TRIGGERS_OP_EMPTY_LABEL",
  is: "SETTINGS_TRIGGERS_OP_IS_LABEL",
  isNot: "SETTINGS_TRIGGERS_OP_IS_NOT_LABEL",
  contains: "SETTINGS_TRIGGERS_OP_CONTAINS_LABEL",
  notContains: "SETTINGS_TRIGGERS_OP_NOT_CONTAINS_LABEL",
  above: "SETTINGS_TRIGGERS_OP_ABOVE_LABEL",
  below: "SETTINGS_TRIGGERS_OP_BELOW_LABEL",
};

type Props = Targeting & {
  lead: string;
  condition: Condition;
  removable: boolean;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
};

export default function TriggerConditionRow(props: Props) {
  const set = (patch: Partial<Condition>) =>
    props.onChange({ ...props.condition, ...patch });

  return (
    <div class="flex items-start gap-2">
      <TriggerLead>{props.lead}</TriggerLead>
      <TriggerResponseField
        value={props.condition.left}
        placeholder={t("SETTINGS_TRIGGERS_CONDITION_LEFT_PLACEHOLDER")}
        onChange={(left) => set({ left })}
        onActivate={props.onActivate}
        onRelease={props.onRelease}
      />
      <div class="h-control-md flex items-center">
        <PopoverButton
          look="menu"
          label={t("SETTINGS_TRIGGERS_COMPARISON_LABEL")}
          icon={<ListFilter class="size-4" />}
          value={t(OP_LABELS[props.condition.op])}
        >
          {(close) =>
            CONDITION_OPS.map((op) => (
              <MenuItem
                label={t(OP_LABELS[op])}
                active={op === props.condition.op}
                onClick={() => {
                  set({ op });
                  close();
                }}
              />
            ))
          }
        </PopoverButton>
      </div>
      <Show when={needsValue(props.condition.op)}>
        <TriggerResponseField
          value={props.condition.right}
          placeholder={t("SETTINGS_TRIGGERS_CONDITION_RIGHT_PLACEHOLDER")}
          onChange={(right) => set({ right })}
          onActivate={props.onActivate}
          onRelease={props.onRelease}
        />
      </Show>
      <Show when={props.removable}>
        <IconButton
          label={t("SETTINGS_TRIGGERS_REMOVE_CONDITION_LABEL")}
          onClick={props.onRemove}
        >
          <X class="size-4" />
        </IconButton>
      </Show>
    </div>
  );
}
