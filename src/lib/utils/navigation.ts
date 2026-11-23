export type View<C extends object> = "explore" | "settings" | C;

export type Navigation<C extends object> = {
  view: View<C>;
  beforeSettings: Exclude<View<C>, "settings">;
  last: C | null;
};

export function startNavigation<C extends object>(): Navigation<C> {
  return { view: "explore", beforeSettings: "explore", last: null };
}

export function channelOf<C extends object>(view: View<C>): C | null {
  return view === "explore" || view === "settings" ? null : view;
}

export function openChannel<C extends object>(
  nav: Navigation<C>,
  channel: C,
): Navigation<C> {
  return { ...nav, view: channel, last: channel };
}

export function openExplore<C extends object>(
  nav: Navigation<C>,
): Navigation<C> {
  return { ...nav, view: "explore" };
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
  if (nav.view === "explore" && nav.last !== null) {
    return { ...nav, view: nav.last };
  }
  return null;
}
