const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

export function domainOf(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(
      HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host.includes(".") ? host : null;
  } catch {
    return null;
  }
}

export function isOnDomain(url: string, domains: readonly string[]): boolean {
  const host = domainOf(url);
  return (
    host !== null &&
    domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
  );
}
