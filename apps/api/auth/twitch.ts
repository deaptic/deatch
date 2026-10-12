import type { Provider } from "../db/schema.ts";
import { ApiError } from "../errors.ts";

export type Identity = { provider: Provider; providerId: string };

export type Validation = { identity: Identity; expiresInSeconds: number };

export type ValidateToken = (token: string) => Promise<Validation | null>;

const VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";

export function twitchValidator(
  clientId: string,
  fetchImpl: typeof fetch = fetch,
): ValidateToken {
  return async (token) => {
    const res = await fetchImpl(VALIDATE_URL, {
      headers: { Authorization: `OAuth ${token}` },
    });
    if (res.status === 401) return null;
    if (!res.ok) {
      throw new ApiError(
        502,
        "upstream",
        `twitch validate returned ${res.status}`,
      );
    }
    const body = await res.json() as {
      client_id: string;
      user_id: string;
      expires_in: number;
    };
    const issuedToAnotherApp = body.client_id !== clientId;
    if (issuedToAnotherApp) return null;
    return {
      identity: { provider: "twitch", providerId: body.user_id },
      expiresInSeconds: body.expires_in,
    };
  };
}

async function tokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(
    new Uint8Array(digest),
    (b) => b.toString(16).padStart(2, "0"),
  )
    .join("");
}

export function cached(
  validate: ValidateToken,
  ttlMs = 60_000,
  maxEntries = 10_000,
): ValidateToken {
  const entries = new Map<
    string,
    { validation: Validation; expires: number }
  >();
  return async (token) => {
    const key = await tokenHash(token);
    const hit = entries.get(key);
    if (hit && hit.expires > Date.now()) return hit.validation;
    const validation = await validate(token);
    if (validation) {
      if (entries.size >= maxEntries) {
        entries.delete(entries.keys().next().value!);
      }
      const ttl = Math.min(ttlMs, validation.expiresInSeconds * 1000);
      entries.set(key, { validation, expires: Date.now() + ttl });
    }
    return validation;
  };
}
