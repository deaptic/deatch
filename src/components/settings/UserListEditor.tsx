import type { User } from "../../lib/types/index.ts";
import { createEffect, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { getUsers } from "../../lib/services/users.ts";
import { resolveUserByLogin } from "../../lib/services/preferences.ts";
import Chip from "../ui/Chip.tsx";
import ChipInput from "../ui/ChipInput.tsx";

type Props = {
  ids: string[];
  placeholder: string;
  onAdd: (user: User) => void;
  onRemove: (id: string) => void;
};

export default function UserListEditor(props: Props) {
  const [meta, setMeta] = createStore<Record<string, User>>({});

  createEffect(() => {
    const missing = props.ids.filter((id) => !meta[id]);
    if (missing.length === 0) return;
    getUsers({ ids: missing })
      .then((users) => {
        for (const u of users) setMeta(u.id, u);
      })
      .catch(() => {});
  });

  async function add(login: string) {
    const u = await resolveUserByLogin(login.toLowerCase());
    if (!u) return;
    setMeta(u.id, u);
    props.onAdd(u);
  }

  return (
    <div class="flex flex-col gap-2">
      <ChipInput placeholder={props.placeholder} onAdd={add} />
      <Show when={props.ids.length > 0}>
        <div class="flex flex-wrap gap-1.5">
          <For each={props.ids}>
            {(id) => (
              <Chip
                label={meta[id]?.displayName ?? id}
                onRemove={() => props.onRemove(id)}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
