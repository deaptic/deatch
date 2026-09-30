export type AppError =
  | { kind: "notAuthenticated" }
  | { kind: "helix"; message: { status: number; message: string } }
  | { kind: "http"; message: string }
  | { kind: "auth"; message: string }
  | { kind: "keyring"; message: string }
  | { kind: "discord"; message: string }
  | { kind: "io"; message: string }
  | { kind: "invalid"; message: string };
