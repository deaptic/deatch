import { For } from "solid-js";
import Chip from "../../../kit/Chip.tsx";
import {
  METHODS,
  methodSyntax,
  type TriggerMethod,
} from "../../../lib/services/triggerMethods.ts";
import { t } from "../../../lib/i18n/index.ts";

export default function TriggerMethodChips(props: {
  onPick: (method: TriggerMethod) => void;
}) {
  return (
    <div class="flex flex-wrap gap-1.5">
      <For each={METHODS}>
        {(method) => (
          <button
            type="button"
            data-tip={t(method.description)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => props.onPick(method)}
            class="cursor-pointer pressable active:pressed"
          >
            <Chip label={methodSyntax(method)} />
          </button>
        )}
      </For>
    </div>
  );
}
