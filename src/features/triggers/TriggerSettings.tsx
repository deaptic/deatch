import { t } from "../../shared/i18n/index.ts";
import { Plus } from "lucide-solid";
import { createSignal, For } from "solid-js";
import PageBody from "../../kit/PageBody.tsx";
import Button from "../../kit/Button.tsx";
import TriggerCard from "./TriggerCard.tsx";
import BuiltIns from "./BuiltIns.tsx";
import { type Trigger } from "../preferences/index.ts";
import {
  blankTrigger,
  removeTrigger,
  saveTrigger,
  customTriggers,
} from "./saved.ts";

export default function TriggerSettings() {
  const [drafts, setDrafts] = createSignal<Trigger[]>([]);
  const [open, setOpen] = createSignal<ReadonlySet<string>>(new Set());
  const isOpen = (id: string) => open().has(id);
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const addDraft = () => {
    const draft = blankTrigger();
    setDrafts((d) => [...d, draft]);
    toggle(draft.id);
  };
  const discardDraft = (id: string) =>
    setDrafts((d) => d.filter((draft) => draft.id !== id));
  const commitDraft = (trigger: Trigger) => {
    saveTrigger(trigger);
    discardDraft(trigger.id);
  };

  return (
    <PageBody title={t("SETTINGS_TRIGGERS_TITLE")}>
      <BuiltIns />
      <For each={customTriggers()}>
        {(trigger) => (
          <TriggerCard
            source={trigger}
            persisted
            expanded={isOpen(trigger.id)}
            onToggle={() => toggle(trigger.id)}
            onSave={saveTrigger}
            onDelete={() => removeTrigger(trigger.id)}
          />
        )}
      </For>
      <For each={drafts()}>
        {(trigger) => (
          <TriggerCard
            source={trigger}
            persisted={false}
            expanded={isOpen(trigger.id)}
            onToggle={() => toggle(trigger.id)}
            onSave={commitDraft}
            onDelete={() => discardDraft(trigger.id)}
          />
        )}
      </For>
      <Button
        variant="neutral"
        class="self-start"
        icon={<Plus class="size-4" />}
        onClick={addDraft}
      >
        {t("SETTINGS_TRIGGERS_ADD_LABEL")}
      </Button>
    </PageBody>
  );
}
