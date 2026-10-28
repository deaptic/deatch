# Testing

Run this before every commit; CI runs the same on every push, with
`pnpm check` and `cargo fmt` checking instead of fixing.

```powershell
pnpm check --fix --deny-warnings && pnpm check:tauri && pnpm test && pnpm build
cd src-tauri
cargo fmt && cargo clippy --all-targets -- -D warnings
cargo test --lib
```

Frontend tests are `*.test.ts` files next to the module they cover, using
Vitest from `vite-plus/test`. `pnpm check` type-checks them with the rest of the
code. Tests run in plain Node with no Tauri and no DOM: importing any module
works, but a call that reaches Tauri fails, or comes back as the failure
outcome of a service that handles it. So pure logic goes in its own file and
that is what gets tested (`services/emoteSetUpdate.ts` and
`mappers/chat-mapper.ts` are the pattern).

Rust tests are a `#[cfg(test)] mod tests` at the bottom of the file. They cover
parsers, mappings, and params, asserting wire shapes with
`serde_json::to_value`, and never do IO. One of them,
`committed_bindings_are_current`, fails when `bindings.ts` is stale; run
`pnpm bindings` and commit. `build.rs` embeds the app manifest so test
binaries can start on Windows; keep it that way.

`pnpm check` enforces the token rules in [DESIGN.md](./DESIGN.md): no raw
hex, shadows, gradients, or arbitrary Tailwind values.
