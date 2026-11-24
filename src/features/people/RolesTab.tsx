import { Gem, Plus, Sword } from "lucide-solid";
import { createSignal, For, type JSX, Show } from "solid-js";
import { type MessageKey, t } from "../../shared/i18n/index.ts";
import { channelSearch } from "../channels/index.ts";
import * as chatters from "./store.ts";
import type { Role } from "./store.ts";
import { feeds } from "../feed/index.ts";
import type { SearchChannel, UserRef } from "../../shared/types/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import Chip from "../../kit/Chip.tsx";
import IconMenuButton from "../../kit/IconMenuButton.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import SearchPicker from "../../kit/SearchPicker.tsx";
import PersonRow from "./PersonRow.tsx";

type RoleLook = {
  role: Role;
  label: MessageKey;
  badge: string;
  fallback: () => JSX.Element;
};

const ROLES: RoleLook[] = [
  {
    role: "moderator",
    label: "PEOPLE_ROLE_MOD_LABEL",
    badge: "moderator/1",
    fallback: () => <Sword class="size-3.5" />,
  },
  {
    role: "vip",
    label: "PEOPLE_ROLE_VIP_LABEL",
    badge: "vip/1",
    fallback: () => <Gem class="size-3.5" />,
  },
];

type Props = {
  broadcasterId: string;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function RolesTab(props: Props) {
  const [picked, setPicked] = createSignal<UserRef | null>(null);
  const list = () => chatters.listFor(props.broadcasterId);
  const icon = (look: RoleLook) => {
    const badge = feeds[props.broadcasterId]?.badges[look.badge];
    return badge ? (
      <img src={badge.url} alt="" class="size-4 object-contain" />
    ) : (
      look.fallback()
    );
  };
  const rolesOf = (userId: string): Role[] => [
    ...(list().moderators.some((u) => u.id === userId)
      ? (["moderator"] as const)
      : []),
    ...(list().vips.some((u) => u.id === userId) ? (["vip"] as const) : []),
  ];
  const people = (): UserRef[] => {
    const withRoles = [...list().moderators, ...list().vips].toSorted((a, b) =>
      a.login.localeCompare(b.login),
    );
    const p = picked();
    return p && !withRoles.some((u) => u.id === p.id)
      ? [p, ...withRoles]
      : withRoles;
  };

  function give(user: UserRef, role: Role) {
    chatters
      .setRole(props.broadcasterId, user.id, rolesOf(user.id)[0] ?? null, role)
      .catch(() => {});
  }

  function take(user: UserRef, role: Role) {
    chatters.setRole(props.broadcasterId, user.id, role, null).catch(() => {});
  }

  return (
    <div class="flex-1 min-h-0 flex flex-col gap-2">
      <SearchPicker
        autofocus
        floating
        label={t("PEOPLE_FIND_PERSON_PLACEHOLDER")}
        placeholder={t("PEOPLE_FIND_PERSON_PLACEHOLDER")}
        search={(query) => channelSearch.find(query)}
        name={(c) => c.user.displayName}
        picture={(c) => (
          <Avatar src={c.profileImageUrl} alt={c.user.displayName} size={24} />
        )}
        onPick={(c: SearchChannel | null) => {
          if (c) setPicked(c.user);
        }}
      />
      <div class="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
        <Show
          when={people().length}
          fallback={
            <p class="py-3 text-body text-ink-faint">
              {t("PEOPLE_ROLES_EMPTY")}
            </p>
          }
        >
          <For each={people()}>
            {(user) => {
              const held = () => rolesOf(user.id);
              const missing = () =>
                ROLES.filter((r) => !held().includes(r.role));
              return (
                <PersonRow
                  user={user}
                  onShowUserCard={props.onShowUserCard}
                  onUserContextMenu={props.onUserContextMenu}
                  action={
                    <div class="shrink-0 flex items-center gap-1.5">
                      <For each={ROLES.filter((r) => held().includes(r.role))}>
                        {(r) => (
                          <Chip
                            label={t(r.label)}
                            icon={icon(r)}
                            onRemove={() => take(user, r.role)}
                          />
                        )}
                      </For>
                      <Show when={missing().length}>
                        <IconMenuButton
                          label={t("PEOPLE_ADD_ROLE_FOR_LABEL", {
                            name: user.displayName,
                          })}
                          tip={false}
                          icon={<Plus class="size-4" />}
                        >
                          <For each={missing()}>
                            {(r) => (
                              <MenuItem
                                label={t(r.label)}
                                icon={icon(r)}
                                onClick={() => give(user, r.role)}
                              />
                            )}
                          </For>
                        </IconMenuButton>
                      </Show>
                    </div>
                  }
                />
              );
            }}
          </For>
        </Show>
      </div>
    </div>
  );
}
