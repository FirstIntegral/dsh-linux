# Decisions & Rationale (ADRs)

Append an entry (date + decision + why + rejected alternatives) in the same turn a meaningful choice is made.

## 2026-10-19 Name the project dsh-linux

- Product name is `dsh-linux`, at `~/Projects/dsh-linux`. DeepSeek's brand guidelines allow "built on DeepSeek Harness" in descriptive text and recommend the short mark DSH when a name should show the link. Rejected `deepseek-harness-linux` and "DeepSeek Harness for Linux" because those put the full trademark in the project name, which the guidelines say to avoid.
- The repo is private: `FirstIntegral/dsh-linux`. The user asked for a private GitHub repo. Rejected a public repo and a local-only tree.
- This session is scaffold only. No shell, no vendored harness, no license file. The desktop stack (Electron, Tauri, or a thinner host) waits until the work session. Official DeepSeek desktop downloads are Windows x64 and macOS arm64; this project is the Linux gap, built on the MIT harness rather than a from-scratch agent.
