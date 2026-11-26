import type { Life } from "../shared/life.ts";
import { attributeOf, isOn, readPageJson } from "../shared/protocol.ts";
import { THEME } from "../shared/theme.ts";
import {
  type PlayerStats,
  readStats,
  type StatItem,
  type StatKind,
  statItems,
} from "./player-stats.ts";

const ROW_ID = "deatch-stats";
const STYLE_ID = "deatch-stats-style";
const UPTIME = ".live-time";

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS: Record<StatKind, string> = {
  latency: svg(
    '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  ),
  buffer: svg(
    '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  ),
  video: svg(
    '<rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
  ),
  bitrate: svg(
    '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  ),
  dropped: svg(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  ),
  catchUp: svg('<path d="M13 19 22 12 13 5z"/><path d="M2 19 11 12 2 5z"/>'),
};

const STYLE = `
#${ROW_ID}{display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px 12px;margin-left:12px;font-variant-numeric:tabular-nums}
#${ROW_ID}[hidden]{display:none}
#${ROW_ID} .stat{display:inline-flex;align-items:center;gap:4px;opacity:.85}
#${ROW_ID} .stat svg{flex:none;opacity:.7}
#${ROW_ID} .stat[data-kind="catchUp"]{color:${THEME.accentInk};opacity:1}
#${ROW_ID} .stat[data-kind="catchUp"] svg{opacity:1}
`;

const statsOnPage = (): PlayerStats | null => readStats(readPageJson("stats"));

function addStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLE;
  document.head.append(style);
}

function statElement({ kind, label, value }: StatItem): HTMLSpanElement {
  const stat = document.createElement("span");
  stat.className = "stat";
  stat.dataset.kind = kind;
  stat.title = label;
  stat.setAttribute("aria-label", `${label} ${value}`);
  stat.innerHTML = ICONS[kind];
  stat.append(value);
  return stat;
}

export function startStatsReadout(life: Life) {
  document.getElementById(ROW_ID)?.remove();
  let queued = false;
  let shown = "";
  const row = document.createElement("span");
  row.id = ROW_ID;
  row.hidden = true;

  function place(): boolean {
    const uptime = document.querySelector(UPTIME);
    if (!uptime) return false;
    if (uptime.nextElementSibling !== row) uptime.after(row);
    return true;
  }

  function show() {
    const stats = isOn("playerStats") && place() ? statsOnPage() : null;
    row.hidden = stats === null;
    const items = stats ? statItems(stats) : [];
    const key = JSON.stringify(items);
    if (key === shown) return;
    shown = key;
    row.replaceChildren(...items.map(statElement));
  }

  addStyle();
  life.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true,
      attributeFilter: [attributeOf("stats"), attributeOf("playerStats")],
    },
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        show();
      });
    },
  );
  show();
}
