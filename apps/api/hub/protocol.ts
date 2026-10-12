export const IDENTITY_HEADER = "x-deatch-identity";
export const HUB_FEATURE = "hub";

export type Envelope = { feature: string; body: Record<string, unknown> };

export function parseEnvelope(raw: unknown): Envelope | null {
  if (typeof raw !== "string") return null;
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!msg || typeof msg !== "object") return null;
  const { feature, ...body } = msg as Record<string, unknown>;
  return typeof feature === "string" && feature ? { feature, body } : null;
}

export function envelope(feature: string, body: Record<string, unknown>) {
  return JSON.stringify({ feature, ...body });
}
