import { t } from "../../../shared/i18n/index.ts";
import { onCleanup, Show } from "solid-js";
import Suggestions from "../../../kit/Suggestions.tsx";
import { commands, type Command, commandUsage } from "../../commands/index.ts";
import { showsRole } from "../../permissions/index.ts";
import { rankSuggestions } from "../../../shared/rankSuggestions.ts";
import type { ChatAutocompleteController } from "./controller.ts";
import Text from "../../../kit/Text.tsx";

type CommandSuggestion = {
  name: string;
  aliases: string[];
  usage?: string;
  description: string;
};

type Props = {
  controller: ChatAutocompleteController;
  broadcasterId: string;
  onCommandSelected: (cmd: Command) => void;
};

export default function CommandAutocomplete(props: Props) {
  const suggestions = (): CommandSuggestion[] => {
    const q = props.controller.queryFor("command");
    if (q === null) return [];
    const items: CommandSuggestion[] = [];
    for (const c of commands) {
      if (!showsRole(props.broadcasterId, c.role)) continue;
      items.push({
        name: c.name,
        aliases: c.aliases ?? [],
        usage: commandUsage(c),
        description: t(c.description),
      });
    }
    return rankSuggestions(items, q, {
      keys: (s) => [s.name, ...s.aliases].map((k) => k.toLowerCase()),
      compare: (a, b) => a.name.localeCompare(b.name),
    });
  };

  function select(s: CommandSuggestion) {
    props.controller.clear();
    props.controller.setValue("");
    const cmd = commands.find((c) => c.name === s.name);
    if (cmd) props.onCommandSelected(cmd);
    else props.controller.focus();
  }

  const render = (s: CommandSuggestion) => (
    <div class="flex flex-col flex-1 min-w-0 text-left">
      <div class="flex items-baseline gap-2 min-w-0">
        <Text bold tone="primary" truncate>
          /{s.name}
        </Text>
        <Show when={s.usage}>
          <Text size="sm" tone="soft" truncate>
            {s.usage}
          </Text>
        </Show>
      </div>
      <Text size="sm" tone="soft" truncate>
        {s.description}
      </Text>
    </div>
  );

  return (
    <Show when={suggestions().length > 0}>
      <Suggestions<CommandSuggestion>
        suggestions={suggestions}
        onSelect={select}
        onClose={props.controller.dismiss}
        renderItem={render}
        selectOnSpace
        ref={(api) => {
          props.controller.register("command", api);
          onCleanup(() => props.controller.unregister("command"));
        }}
      />
    </Show>
  );
}
