# Testing

Run this before every commit; CI runs the same on every push.

```powershell
vp check --fix --deny-warnings && pnpm check:tauri && pnpm test
cd src-tauri
cargo fmt && cargo clippy --all-targets -- -D warnings
cargo test --lib
```

Frontend tests are `*.test.ts` files next to the module they cover, using
Vitest from `vite-plus/test`. `vp check` type-checks them with the rest of the
code. Anything that touches Tauri at load fails under `vp test`, so pure logic
goes in its own file and that is what gets tested (`services/emoteSetUpdate.ts`
and `events/chat-mapper.ts` are the pattern).

Rust tests are a `#[cfg(test)] mod tests` at the bottom of the file. They cover
parsers, mappings, and params, asserting wire shapes with
`serde_json::to_value`, and never do IO. One of them,
`committed_bindings_are_current`, fails when `bindings.ts` is stale; run
`pnpm bindings` and commit. `build.rs` embeds the app manifest so test
binaries can start on Windows; keep it that way.

`vp check` enforces the token rules in [DESIGN.md](./DESIGN.md): no raw
hex, shadows, gradients, or arbitrary Tailwind values.
