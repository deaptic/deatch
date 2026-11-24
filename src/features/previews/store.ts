import { createSignal } from "solid-js";
import * as browser from "../../platform/browser.ts";
import { linkPreview } from "../../platform/previews.ts";
import type { LinkPreview } from "../../shared/types/index.ts";
import { domainOf, isOnDomain } from "../../shared/domain.ts";
import {
  addTrustedDomain,
  removeTrustedDomain,
  trustedDomains,
} from "../preferences/index.ts";

const CACHE_LIMIT = 300;
const MAX_PREVIEWS = 3;

export const pick = (urls: string[]) =>
  [...new Set(urls)].slice(0, MAX_PREVIEWS);

const cache = new Map<string, Promise<LinkPreview | null>>();
const [pending, setPending] = createSignal<string | null>(null);

export const pendingLink = pending;

export const isTrusted = (url: string) => isOnDomain(url, trustedDomains());

export function get(url: string): Promise<LinkPreview | null> {
  const cached = cache.get(url);
  if (cached) return cached;
  const fetched = linkPreview(url, { silent: true }).catch(() => null);
  cache.set(url, fetched);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return fetched;
}

export function open(url: string) {
  if (isTrusted(url)) browser.open(url);
  else setPending(url);
}

export function confirm() {
  const url = pending();
  setPending(null);
  if (url) browser.open(url);
}

export function setTrusted(url: string, trusted: boolean) {
  const domain = domainOf(url);
  if (!domain) return;
  if (trusted) addTrustedDomain(domain);
  else removeTrustedDomain(domain);
}

export function cancel() {
  setPending(null);
}

export const pendingDomain = () => {
  const url = pending();
  return url ? domainOf(url) : null;
};
