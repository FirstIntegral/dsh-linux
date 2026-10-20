# dsh-linux

## Overview

Unofficial Linux desktop for DeepSeek Harness. Not affiliated with, endorsed by, or maintained by DeepSeek. "Built on DeepSeek Harness" is the relationship. The product name stays `dsh-linux`.

## Stack / Conventions

Electron 44 shell (`src/main.mjs`) around the published npm package `@deepseek-ai/dsh` (pinned `0.2.1-rc.2`). Boot profile is `web`, with `--no-open`. The harness stays upstream: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness), MIT, copyright DeepSeek. Do not vendor that tree. Do not patch it so `dev:desktop` runs here — that launcher rejects `linux-x64` (`docs/BOOT.md`). Our code is MIT (`LICENSE`). No official DeepSeek logos.

Naming follows DeepSeek's published brand guidelines (`BRAND_GUIDELINES.md` in that repo):

- Descriptive text may say "built on DeepSeek Harness" or "compatible with DeepSeek Harness."
- The project name uses the short mark DSH. It does not use the full trademark "DeepSeek Harness."
- Do not use official DeepSeek logos or brand art in a way that implies an official port, endorsement, or partnership.

## Commands

- Install: `npm install` (Node >= 24; this machine has Node 26). `scripts/postinstall.mjs` downloads Electron and the node-pty prebuild.
- Test: `npm test` (pure helpers in `src/ready.mjs` and `src/nav.mjs`; no Electron)
- Run: `bin/dsh-linux` (`--port` or `DSH_LINUX_PORT`, default 3080)
- Menu: `bin/install-desktop.sh`

## Repo

- Remote: `git@github.com:FirstIntegral/dsh-linux.git`
- Visibility: public. Not an npm package (`package.json` `"private": true`).

Documentation, not authorisation: `checkpoint.sh` cross-checks this against `git remote get-url --push` and warns on a mismatch, but git config is what actually decides where a push goes. Keep this line current when the remote changes; never treat it as permission to push. A project with `none (local only)` is in a deliberate state — nothing may create a repo or remote for it without the user asking.

## Session files

- `session_compact.md` — AI handoff state. Read FIRST at session start; rewrite at end of session / milestone. Local-only (gitignored): never commit unless the user says otherwise.
- `session_transcript.md` — human-ONLY narrative log. Append at milestones; AI NEVER reads it unless the user explicitly asks. Local-only (gitignored): never commit unless the user says otherwise.
- `docs/DECISIONS.md` — ADR log; append decision + why in the same turn it is made. Versioned (committed in repos).
- `notes.allow` — optional extra paths copied to the private machine-notes repo. Gitignored. One relative path per line.
- `.gitignore` — ignores the session files above, `claude_memory_import.md`, `notes.allow`, and legacy session paths. Sites under `~/Projects/sites/` also ignore `AGENTS.md` / `CLAUDE.md`.
