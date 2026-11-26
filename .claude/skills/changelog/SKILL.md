---
name: changelog
description: Write the CHANGELOG.md section for the next Deatch release from the commits since the last tag. Use when asked for a changelog, release notes, or "what's new" before running `vp run release`.
---

# Changelog

Writes one new section at the top of `CHANGELOG.md`. The section becomes the
GitHub Release text and an entry on the app's "What's new" page; its summary and
`New` and `Improved` lines also pop up the first time an updated copy starts.

## Steps

1. Find the last release: `git describe --tags --abbrev=0`.
2. Read what changed since then: `git log <tag>..HEAD --format="%h %s%n%b"`.
   Open a commit's diff when its message doesn't make clear what a user would
   notice.
3. Ask which version this is if the user didn't say: the next patch, unless the
   release adds something big enough for a minor.
4. Write the section under the `# Changelog` intro, following the writing rules
   in `docs/RELEASING.md`, in this shape:

   ```markdown
   ## v0.4.4 — 27 November 2026

   One sentence that sums up the release.

   ### New

   - …

   ### Improved

   - …

   ### Fixed

   - …
   ```

5. Show the user the section and wait for changes before they commit. Don't
   commit, tag or release yourself.

## Keep it short

- The summary names the one or two biggest changes, in under 15 words.
- Group by feature, not by commit: one line per feature, briefly saying what it
  adds, even when it took many commits. At most 5 lines in `New` and 5 in
  `Improved`. They're what users see in the app, so each must make sense alone.
- Fixes users would have hit get their own line; leave the rest out, with no
  catch-all line like "Many smaller fixes".
- Plain text only: no bold, code marks or links. The app shows lines as written.
- No line over about 20 words. One sentence per line, two at most.
- A release with only invisible changes still gets a section: just the summary.
