# dsh-linux

Unofficial Linux desktop, built on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

Not affiliated with, endorsed by, or maintained by DeepSeek. This is not an official port.

The shell is Electron. It boots the published `web` profile of `@deepseek-ai/dsh` and does not fork the harness. See `docs/BOOT.md`.

```sh
npm install
bin/dsh-linux
bin/install-desktop.sh
```

`--port <n>` or `DSH_LINUX_PORT` chooses the port. The default is 3080. Provider keys stay in the harness credential file. The window does not read them. See `docs/BOOT.md`.
