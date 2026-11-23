import { Index, Show } from "solid-js";
import { Plus } from "lucide-solid";
import Button from "../../ui/Button.tsx";
import TriggerConditionalReply from "./TriggerConditionalReply.tsx";
import TriggerMethodChips from "./TriggerMethodChips.tsx";
import TriggerResponseField, {
  type Insert,
  type Targeting,
} from "./TriggerResponseField.tsx";
import { BLANK_CONDITION } from "../../../lib/services/conditionGroups.ts";
import { moved } from "../../../lib/utils/moved.ts";
import { removedAt, replacedAt } from "../../../lib/utils/listEdit.ts";
import type { ConditionalReply } from "../../../lib/stores/preferences.ts";
import { t } from "../../../lib/i18n/index.ts";

const BLANK_REPLY: ConditionalReply = { when: [[BLANK_CONDITION]], text: "" };

type Props = {
  replies: ConditionalReply[];
  otherwise: string;
  onRepliesChange: (replies: ConditionalReply[]) => void;
  onOtherwiseChange: (text: string) => void;
};

export default function TriggerReplies(props: Props) {
  let focused: Insert | undefined;
  let otherwiseInsert: Insert | undefined;
  const targeting: Targeting = {
    onActivate: (insert) => (focused = insert),
    onRelease: (insert) => {
      if (focused === insert) focused = undefined;
    },
  };
  const hasReplies = () => props.replies.length > 0;

  return (
    <div class="flex flex-col gap-3">
      <Index each={props.replies}>
        {(reply, index) => (
          <TriggerConditionalReply
            reply={reply()}
            number={index + 1}
            first={index === 0}
            last={index === props.replies.length - 1}
            onChange={(next) =>
              props.onRepliesChange(replacedAt(props.replies, index, next))
            }
            onMove={(step) =>
              props.onRepliesChange(moved(props.replies, index, index + step))
            }
            onRemove={() =>
              props.onRepliesChange(removedAt(props.replies, index))
            }
            {...targeting}
          />
        )}
      </Index>
      <div
        class={`flex flex-col gap-2 ${hasReplies() ? "pl-3 border-l-2 border-line" : ""}`}
      >
        <Show when={hasReplies()}>
          <span class="h-control-sm flex items-center text-small font-semibold text-ink-soft">
            {t("SETTINGS_TRIGGERS_OTHERWISE")}
          </span>
        </Show>
        <TriggerResponseField
          value={props.otherwise}
          placeholder={
            hasReplies()
              ? t("SETTINGS_TRIGGERS_OTHERWISE_PLACEHOLDER")
              : t("SETTINGS_TRIGGERS_REPLY_PLACEHOLDER")
          }
          onChange={props.onOtherwiseChange}
          onActivate={(insert) => {
            otherwiseInsert = insert;
            focused = insert;
          }}
          onRelease={targeting.onRelease}
        />
      </div>
      <TriggerMethodChips
        onPick={(method) => (focused ?? otherwiseInsert)?.(method)}
      />
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Plus class="size-4" />}
          onClick={() => props.onRepliesChange([...props.replies, BLANK_REPLY])}
        >
          {t("SETTINGS_TRIGGERS_ADD_REPLY")}
        </Button>
      </div>
    </div>
  );
}
