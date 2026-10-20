# Decisions & Rationale (ADRs)

Append an entry (date + decision + why + rejected alternatives) in the same turn a meaningful choice is made.

## 2026-10-19 Name the project dsh-linux

- Product name is `dsh-linux`, at `~/Projects/dsh-linux`. DeepSeek's brand guidelines allow "built on DeepSeek Harness" in descriptive text and recommend the short mark DSH when a name should show the link. Rejected `deepseek-harness-linux` and "DeepSeek Harness for Linux" because those put the full trademark in the project name, which the guidelines say to avoid.
- The repo is private: `FirstIntegral/dsh-linux`. The user asked for a private GitHub repo. Rejected a public repo and a local-only tree.
- This session is scaffold only. No shell, no vendored harness, no license file. The desktop stack (Electron, Tauri, or a thinner host) waits until the work session. Official DeepSeek desktop downloads are Windows x64 and macOS arm64; this project is the Linux gap, built on the MIT harness rather than a from-scratch agent.

## 2026-10-20 Thin Electron shell around `dsh web`

- The Linux shell is our Electron 44 window. It spawns system Node on the published `@deepseek-ai/dsh@0.2.1-rc.2` bin: `web --no-open --port <n>`. The ready signal is the upstream line `dsh web: <authenticated-url>`. The window loads that URL only when it is loopback http(s). Logs redact the token. Quit SIGTERMs the process group.
- Rejected upstream `pnpm run dev:desktop` / `make dev-desktop`. `apps/desktop/scripts/dev.ts` calls `resolveDesktopBuildTarget()`. `SUPPORTED_TARGETS` is `mac-arm64`, `mac-x64`, `win-x64`. On this x64 host the throw is `desktop build paths: unsupported target linux-x64`, before Electron launches. `desktopTargetPlatform()` maps every non-Windows target to `darwin`, so adding `linux-x64` to the set does not make a Linux payload. The mandatory-update policy throw in `main.ts` is a second Linux reject, and it runs only when a policy config is present. Patching any of that is a fork of the harness. Not this step. Tag read: `dsh-v0.2.1-rc.2` at `687f282e8625c6b8d11ff58211a90524be2e4317`.
- Rejected Tauri. The official desktop carrier is Electron. A Tauri window would be a second shell around the same `web` profile, and this host is NVIDIA (RTX 5070) on Hyprland. WebKitGTK's native Wayland path still has an open protocol-error report on NVIDIA (WebKit bug 280210, comment 14, 2026-10-09). That is not a Hyprland black-window citation. A third-party Tauri package is not our shell.
- Rejected a `.desktop` file that only opens the system browser. That is the upstream `dsh web` quick start already. The gap is a window we own, with `--no-open`, one process group, and a title that does not present itself as the official desktop.
- Our `LICENSE` is MIT, copyright brwsk, 2026. The harness is an npm dependency, not a copy in git. Its license stays MIT, copyright DeepSeek. Official logos stay out. Electron is pinned at `44.9.1`, which satisfies upstream desktop's `electron ^44.7.0`.
- `DSH_HOME` is not overridden. Sessions are the `web` profile, shared with a terminal `dsh web`, not the reserved `desktop` profile.
- Wayland app id is `app.setDesktopName('dsh-linux.desktop')`. Electron 44 does not read Chromium `--class`, so that switch does not set the Hyprland class. Rejected leaving the default Electron app id.
- `bin/dsh-linux` puts Ozone and GPU switches before the checkout path and puts `--port` after it. Electron treats the first bare word as the app path, so `--port 3091` in front never reaches the shell.

## 2026-10-20 Keys stay in the harness, the window stays on loopback

- Provider keys stay in the harness credential file (`~/.dsh`, owner mode `0600`). The shell does not read that file, does not put key material in the window title, and redacts URLs, `Bearer` values, `sk-` tokens, and `api_key=` assignments before anything reaches stdout or an error dialog. Crash dumps are not uploaded (`disable-crash-reporter`). The child Node process still inherits the user environment, because that is how `DEEPSEEK_API_KEY` and the other harness references resolve. Printing that environment was the rejected alternative.
- The main window may navigate only to the harness origin. `window.open('about:blank')` stays inside a sandboxed popup so account sign-in can `location.replace` the authorize URL. Other `http:` and `https:` opens go to the system browser. `javascript:`, `file:`, and `data:` are refused. Rejected leaving the old rule that allowed any `https:` navigation of the main window: that lets a page replace the app with a lookalike while the title still says `dsh-linux`.
- Clipboard read, camera, and display capture stay denied. Microphone, notifications, and fullscreen stay allowed on the loopback origin so voice and the app chrome keep working. Paste still uses the normal edit menu path, which does not need clipboard-read.
- No AppImage. The shell needs system Node and the user's harness home. Bundling the harness into an image would vendor it, which this project does not do. The menu entry from `bin/install-desktop.sh` is the install. The icon is an original ring mark, not a DeepSeek logo.

## 2026-10-20 The repo is public, the icon stays the ring

- GitHub visibility becomes public at the user's request. A scan of the tree and history found no provider keys, only the redaction tests. `package.json` stays `"private": true`, so this is not an npm publish.
- The icon stays the original dark tile, amber ring, and cream bead. Upstream's own badge, in `@deepseek-ai/dsh-skill-badge`, is a blue pill (`#4D6BFE`) with the letters dsh. Copying that art was rejected. The ring is not a stand-in for their logo, and it does not need to be.
