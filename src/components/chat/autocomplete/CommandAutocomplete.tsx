import { onCleanup, Show } from "solid-js";
import Suggestions from "../../suggestions/Suggestions";
import { commands } from "../../command-composer/commands";
import type { Command } from "../../command-composer/types";
import { isBroadcasterOfChannel, isModOfChannel } from "../../../lib/stores/users";
import { moderationActionsDisabled } from "../../../lib/stores/preferences";
import type { ChatAutocompleteController } from "./controller";

type CommandSuggestion = { name: string; usage?: string; description: string };

type Props = {
  controller: ChatAutocompleteController;
  broadcasterId: string;
  onCommandSelected: (cmd: Command) => void;
};

function canRunCommand(cmd: Command, broadcasterId: string): boolean {
  if (cmd.role === "regular") return true;
  if (moderationActionsDisabled()) return false;
  if (cmd.role === "broadcaster") return isBroadcasterOfChannel(broadcasterId);
  return isModOfChannel(broadcasterId);
}

export default function CommandAutocomplete(props: Props) {
  const suggestions = (): CommandSuggestion[] => {
    const q = props.controller.queryFor("command");
    if (q === null) return [];
    const lower = q.toLowerCase();
    const starts: CommandSuggestion[] = [];
    const contains: CommandSuggestion[] = [];
    for (const c of commands) {
      if (!canRunCommand(c, props.broadcasterId)) continue;
      const usage = c.options
        .map((o) => (o.required === false ? `[${o.name}?]` : `[${o.name}]`))
        .join(" ");
      const item = { name: c.name, usage, description: c.description };
      if (lower === "" || c.name.startsWith(lower)) starts.push(item);
      else if (c.name.includes(lower)) contains.push(item);
    }
    starts.sort((a, b) => a.name.localeCompare(b.name));
    contains.sort((a, b) => a.name.localeCompare(b.name));
    return [...starts, ...contains];
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
        <span class="font-semibold text-text truncate">/{s.name}</span>
        <Show when={s.usage}>
          <span class="text-xs text-text-muted truncate">{s.usage}</span>
        </Show>
      </div>
      <span class="text-xs text-text-muted truncate">{s.description}</span>
    </div>
  );

  return (
    <Show when={suggestions().length > 0}>
      <Suggestions<CommandSuggestion>
        suggestions={suggestions}
        onSelect={select}
        onDismiss={props.controller.dismiss}
        renderItem={render}
        ref={(api) => {
          props.controller.registerKeyHandler("command", api.handleKey);
          onCleanup(() => props.controller.unregisterKeyHandler("command"));
        }}
      />
    </Show>
  );
}
