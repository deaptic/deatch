import { Plus } from "lucide-solid";
import { createSignal, For } from "solid-js";
import SettingsContent from "../SettingsContent.tsx";
import Button from "../../ui/Button.tsx";
import TriggerCard from "./TriggerCard.tsx";
import {
  blankTrigger,
  removeTrigger,
  saveTrigger,
  type Trigger,
  triggers,
} from "../../../lib/stores/preferences.ts";

export default function TriggersSection() {
  const [drafts, setDrafts] = createSignal<Trigger[]>([]);

  const addDraft = () => setDrafts((d) => [...d, blankTrigger()]);
  const discardDraft = (id: string) =>
    setDrafts((d) => d.filter((t) => t.id !== id));
  const commitDraft = (trigger: Trigger) => {
    saveTrigger(trigger);
    discardDraft(trigger.id);
  };

  return (
    <SettingsContent>
      <div class="flex flex-col gap-1">
        <h2 class="text-text text-lg font-semibold">Triggers</h2>
        <p class="text-text-muted text-sm">
          Automatically send or reply with a message when a chat message in your
          own channel matches a phrase. Changes apply when you save.
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <For each={triggers()}>
          {(t) => (
            <TriggerCard
              source={t}
              persisted
              onSave={saveTrigger}
              onDelete={() => removeTrigger(t.id)}
            />
          )}
        </For>
        <For each={drafts()}>
          {(t) => (
            <TriggerCard
              source={t}
              persisted={false}
              onSave={commitDraft}
              onDelete={() => discardDraft(t.id)}
            />
          )}
        </For>
        <Button
          variant="secondary"
          class="self-start"
          icon={<Plus class="size-4" />}
          onClick={addDraft}
        >
          Add trigger
        </Button>
      </div>
    </SettingsContent>
  );
}
