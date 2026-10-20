# Boot path

dsh-linux is a window around the upstream `web` profile. It does not vendor or patch [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness).

## What runs

1. `bin/dsh-linux` starts Electron from this checkout.
2. The shell spawns system `node` (not the Electron binary) on the installed `@deepseek-ai/dsh` bin:

   ```text
   node node_modules/@deepseek-ai/dsh/lib/bin.js web --no-open --port 3080
   ```

3. Upstream prints one ready line once the loader has settled:

   ```text
   dsh web: <authenticated-url>
   ```

   That line is the supervisor contract in `packages/bundle/web-app`. The shell loads it only when the URL is loopback `http:` or `https:`. The token stays in the window. Logs keep the origin and drop the rest.

4. Closing the window SIGTERMs the `dsh` process group, then SIGKILL after 6 seconds. The CLI's own dispose cap is 5 seconds. The session log keeps a torn tail as crash recovery, so the extra second is only so that cap can finish.

Pin: `@deepseek-ai/dsh@0.2.1-rc.2`. That is the same version as git tag `dsh-v0.2.1-rc.2` (`687f282e8625c6b8d11ff58211a90524be2e4317`), which is what this boot path was read against. Electron is pinned at `44.9.1` (upstream desktop declares `electron ^44.7.0`).

Default port is 3080. `--port <n>` or `DSH_LINUX_PORT` overrides it. `--host` is not passed. Upstream rejects `--host 0.0.0.0`. A non-loopback ready URL is refused.

`DSH_HOME` is whatever the user already has. Unset means upstream's default, shared with a terminal `dsh web`. This shell does not use the reserved `desktop` profile.

## Why this is not `dev:desktop`

Upstream's development launcher calls `resolveDesktopBuildTarget()`. The supported set is `mac-arm64`, `mac-x64`, and `win-x64`. On Linux x64 it throws `desktop build paths: unsupported target linux-x64` before Electron starts. `desktopTargetPlatform()` then treats every non-Windows target as `darwin`. Running that app here means patching the harness. That is a fork, and it is not this boot path.

The published CLI profile `web` is the supported Linux UI. `npx @deepseek-ai/dsh web` is the upstream quick start. We pin the same package and pass `--no-open` so the shell owns the window.

## Run

```sh
npm install
bin/dsh-linux
```

Electron 38 and newer already opens a Wayland window when `XDG_SESSION_TYPE=wayland`. On NVIDIA, a black window is the fallback case: quit, then `bin/dsh-linux --ozone-platform=x11`. `--disable-gpu` is the step after that, not the default. Node must be 24 or newer. The harness repo root allows `^22.19.0 || >=24`. The published CLI package does not declare `engines`.

## Menu

```sh
bin/install-desktop.sh
```

That writes `~/.local/share/applications/dsh-linux.desktop` with absolute paths, links `~/.local/bin/dsh-linux`, and copies the icon into the hicolor theme. The icon is an original ring. It is not a DeepSeek logo.

There is no AppImage. This shell needs system Node and the user's `~/.dsh`. Vendoring the harness into an image is a fork of the delivery, and this repo does not do that.

## Keys

The harness stores provider keys in its own file, mode `0600`, under `~/.dsh`. This shell does not open that file. Logs and error dialogs drop URLs down to an origin, plus `Bearer` values, `sk-` tokens, and `api_key=` style assignments. Crash reports are not uploaded. The main window stays on the loopback origin. Account sign-in still works: the page opens `about:blank`, then `location.replace`s the authorize URL in that sandboxed popup. Other web links open in the system browser.
