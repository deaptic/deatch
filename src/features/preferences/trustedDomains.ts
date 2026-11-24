import { domainOf } from "../../shared/domain.ts";
import { prefs, setPrefs } from "./core.ts";

export const trustedDomains = () => prefs.feed.trustedDomains;

export function addTrustedDomain(input: string) {
  const domain = domainOf(input);
  if (!domain || prefs.feed.trustedDomains.includes(domain)) return;
  setPrefs("feed", "trustedDomains", (list) => [...list, domain]);
}

export function removeTrustedDomain(domain: string) {
  setPrefs("feed", "trustedDomains", (list) =>
    list.filter((d) => d !== domain),
  );
}
