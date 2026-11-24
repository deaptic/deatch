import {
  createEffect,
  createResource,
  createSignal,
  For,
  Show,
} from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { getFollowers } from "../../platform/twitch/channels.ts";
import { Time } from "../../shared/time.ts";
import { matchesPerson } from "./model.ts";
import { loginOf, userRefOf } from "../../shared/user.ts";
import type { Follower, UserRef } from "../../shared/types/index.ts";
import { type FollowStatus, users } from "../users/index.ts";
import Button from "../../kit/Button.tsx";
import Loading from "../../kit/Loading.tsx";
import PersonRow from "./PersonRow.tsx";
import { createPaged } from "./createPaged.ts";

type Check =
  | { kind: "missing" }
  | { kind: "found"; user: UserRef; follow: FollowStatus };

type Props = {
  onCount: (count: number, more: boolean) => void;
  broadcasterId: string;
  query: string;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function FollowersTab(props: Props) {
  const [checked, setChecked] = createSignal<string | null>(null);
  const paged = createPaged<Follower>((cursor) =>
    getFollowers({ broadcasterId: props.broadcasterId, cursor }).then(
      (page) => ({
        items: page.followers,
        cursor: page.cursor,
        total: page.total,
      }),
    ),
  );
  const followers = paged.items;

  createEffect(() => {
    const c = paged.count();
    if (c) props.onCount(c.count, c.more);
  });

  const [check] = createResource(checked, async (login): Promise<Check> => {
    const lookup = await users.findByLogin(login, { silent: true });
    if (lookup.status !== "found") return { kind: "missing" };
    const user = userRefOf(lookup.user);
    return {
      kind: "found",
      user,
      follow: await users.followStatus(props.broadcasterId, user.id),
    };
  });

  const login = () => loginOf(props.query);
  const shown = () =>
    (followers() ?? []).filter((f) => matchesPerson(f.user, props.query));
  const loaded = () => shown().some((f) => f.user.login === login());
  const result = () => (checked() === login() ? check() : undefined);
  const found = () => {
    const r = result();
    return r?.kind === "found" ? r : null;
  };

  const followedOn = (at: string) =>
    t("PEOPLE_FOLLOWED_ON_STATUS", { date: new Time(at, "f").toString() });
  const followText = (follow: FollowStatus) =>
    follow.kind === "since"
      ? followedOn(follow.at)
      : follow.kind === "none"
        ? t("USER_CARD_NOT_FOLLOWING_STATUS")
        : t("USER_CARD_FOLLOW_UNKNOWN_STATUS");

  return (
    <div
      class="flex-1 min-h-0 overflow-y-auto -mx-2 px-2"
      onScroll={paged.nearEnd}
    >
      <Show when={login() && !loaded()}>
        <Show
          when={found()}
          fallback={
            <Show
              when={result()?.kind === "missing"}
              fallback={
                <div class="px-2 py-1">
                  <Button
                    variant="neutral"
                    size="sm"
                    loading={check.loading && checked() === login()}
                    onClick={() => setChecked(login())}
                  >
                    {t("PEOPLE_CHECK_FOLLOW_LABEL", { name: login() })}
                  </Button>
                </div>
              }
            >
              <p class="px-2 py-1 text-body text-ink-faint">
                {t("PEOPLE_NO_SUCH_USER_STATUS", { name: login() })}
              </p>
            </Show>
          }
        >
          {(f) => (
            <PersonRow
              user={f().user}
              detail={followText(f().follow)}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
          )}
        </Show>
      </Show>
      <Show
        when={followers()}
        fallback={
          <div class="grid place-items-center py-6">
            <Loading />
          </div>
        }
      >
        <Show
          when={shown().length || login()}
          fallback={
            <p class="py-3 text-body text-ink-faint">
              {t("PEOPLE_FOLLOWERS_EMPTY")}
            </p>
          }
        >
          <For each={shown()}>
            {(follower) => (
              <PersonRow
                user={follower.user}
                detail={followedOn(follower.followedAt)}
                onShowUserCard={props.onShowUserCard}
                onUserContextMenu={props.onUserContextMenu}
              />
            )}
          </For>
        </Show>
      </Show>
    </div>
  );
}
