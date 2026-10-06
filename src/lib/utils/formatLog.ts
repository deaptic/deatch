export function formatLog(args: unknown[]): string {
  return args.map(formatValue).join(" ");
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }
  if (value === undefined || typeof value === "function") return String(value);
  try {
    return JSON.stringify(value, errorReplacer);
  } catch {
    return String(value);
  }
}

function errorReplacer(_key: string, value: unknown): unknown {
  return value instanceof Error
    ? { name: value.name, message: value.message }
    : value;
}
