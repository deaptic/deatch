type Page = { data: unknown[]; pagination?: { cursor: string | null } };

export type ListSize = { count: number; more: boolean };

function isPage(value: unknown): value is Page {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray((value as { data?: unknown }).data)
  );
}

export function listSize(result: unknown): ListSize | null {
  if (Array.isArray(result)) return { count: result.length, more: false };
  if (isPage(result)) {
    return {
      count: result.data.length,
      more: Boolean(result.pagination?.cursor),
    };
  }
  return null;
}
