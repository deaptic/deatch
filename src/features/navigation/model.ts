export type Page = "explore" | "inbox" | "changelog";

export type View<C extends object> = Page | "settings" | C;

export type Navigation<C extends object> = {
  view: View<C>;
  beforeSettings: Exclude<View<C>, "settings">;
  last: C | null;
};

export function startNavigation<C extends object>(): Navigation<C> {
  return { view: "explore", beforeSettings: "explore", last: null };
}

export function channelOf<C extends object>(view: View<C>): C | null {
  return typeof view === "string" ? null : view;
}

export function openChannel<C extends object>(
  nav: Navigation<C>,
  channel: C,
): Navigation<C> {
  return { ...nav, view: channel, last: channel };
}

export function openPage<C extends object>(
  nav: Navigation<C>,
  page: Page,
): Navigation<C> {
  return { ...nav, view: page };
}

export function toggleSettings<C extends object>(
  nav: Navigation<C>,
): Navigation<C> {
  if (nav.view === "settings") return { ...nav, view: nav.beforeSettings };
  return { ...nav, view: "settings", beforeSettings: nav.view };
}

export function leavePage<C extends object>(
  nav: Navigation<C>,
): Navigation<C> | null {
  if (nav.view === "settings") return { ...nav, view: nav.beforeSettings };
  if (typeof nav.view === "string" && nav.last !== null) {
    return { ...nav, view: nav.last };
  }
  return null;
}
