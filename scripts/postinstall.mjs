/** Fetch the Electron binary and the published node-pty prebuild. No network beyond those installers. */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function run(script) {
  if (!existsSync(script)) return
  const result = spawnSync(process.execPath, [script], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(path.join(root, 'node_modules', 'electron', 'install.js'))
run(path.join(root, 'node_modules', 'node-pty', 'scripts', 'prebuild.js'))
run(path.join(root, 'node_modules', '@deepseek-ai', 'dsh-subprocess-local', 'scripts', 'ensure-spawn-helper.mjs'))
