export function formatUrl(url: string): string {
  const { hostname, pathname } = new URL(url);
  const path = pathname === "/" ? "" : pathname;
  return `${hostname.replace(/^www\./, "")}${path}`;
}
