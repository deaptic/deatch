import { For } from "solid-js";
import Chip from "../../../kit/Chip.tsx";
import { METHODS, methodSyntax, type TriggerMethod } from "../methods.ts";
import { t } from "../../../shared/i18n/index.ts";

export default function MethodChips(props: {
  onPick: (method: TriggerMethod) => void;
}) {
  return (
    <div class="flex flex-wrap gap-1.5">
      <For each={METHODS}>
        {(method) => (
          <Chip
            label={methodSyntax(method)}
            title={t(method.description)}
            onClick={() => props.onPick(method)}
          />
        )}
      </For>
    </div>
  );
}
