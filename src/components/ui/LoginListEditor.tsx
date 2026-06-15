import { createEffect, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { getUsers, type User } from "../../lib/api/twitch/users.ts";
import { resolveUserByLogin } from "../../lib/services/preferences.ts";
import ChipInput from "./ChipInput.tsx";
import ChipList from "./ChipList.tsx";
import Chip from "./Chip.tsx";

type Props = {
  ids: string[];
  placeholder?: string;
  onAdd: (user: User) => void;
  onRemove: (id: string) => void;
};

export default function LoginListEditor(props: Props) {
  const [meta, setMeta] = createStore<Record<string, User>>({});

  createEffect(() => {
    const missing = props.ids.filter((id) => !meta[id]);
    if (missing.length === 0) return;
    getUsers({ ids: missing })
      .then((users) => {
        const updates: Record<string, User> = {};
        for (const u of users) updates[u.id] = u;
        setMeta(updates);
      })
      .catch(() => {});
  });

  async function add(login: string) {
    const u = await resolveUserByLogin(login);
    if (!u) return;
    setMeta(u.id, u);
    props.onAdd(u);
  }

  return (
    <div class="flex flex-col gap-2">
      <ChipInput
        placeholder={props.placeholder}
        normalize={(v) => v.trim().toLowerCase()}
        onAdd={add}
      />
      <Show when={props.ids.length > 0}>
        <ChipList>
          <For each={props.ids}>
            {(id) => (
              <Chip
                label={meta[id]?.displayName ?? meta[id]?.login ?? id}
                onRemove={() => props.onRemove(id)}
              />
            )}
          </For>
        </ChipList>
      </Show>
    </div>
  );
}
