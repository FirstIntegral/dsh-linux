import { app, BrowserWindow, dialog, session } from 'electron'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { isLoopbackUrl, parsePort, parseReadyLine, redact, stripTokenQuery } from './ready.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const READY_MS = 180_000
const TERM_MS = 6_000

app.setName('dsh-linux')
app.setPath('userData', path.join(homedir(), '.local', 'share', 'dsh-linux'))

// Electron 38+ already picks Wayland when XDG_SESSION_TYPE=wayland.
// --ozone-platform is a force and must be on the Electron command line
// (bin/dsh-linux puts those switches before the app path).
// Wayland app_id comes from the desktop name, not Chromium --class.
app.setDesktopName('dsh-linux.desktop')

const ownsInstance = app.requestSingleInstanceLock()
if (!ownsInstance) app.quit()

/** @type {import('node:child_process').ChildProcess | null} */
let child = null
/** @type {BrowserWindow | null} */
let window = null
/** @type {string | null} */
let readyUrl = null
/** @type {string | null} */
let readyOrigin = null
let stopping = false
let failed = false
/** @type {string[]} */
const tail = []
/** @type {ReturnType<typeof setTimeout> | null} */
let readyTimer = null

function remember(line) {
  const safe = redact(line)
  tail.push(safe)
  if (tail.length > 40) tail.shift()
  process.stdout.write(`${safe}\n`)
}

function dshBin() {
  const pkgJson = path.join(projectRoot, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')
  const manifest = JSON.parse(readFileSync(pkgJson, 'utf8'))
  const relative = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.dsh
  if (typeof relative !== 'string' || relative === '') {
    throw new Error('dsh-linux: @deepseek-ai/dsh has no dsh bin')
  }
  return path.join(path.dirname(pkgJson), relative)
}

function childEnv() {
  const env = { ...process.env }
  // process.execPath inside Electron is the Electron binary. The child must be Node.
  delete env.ELECTRON_RUN_AS_NODE
  for (const key of Object.keys(env)) {
    if (key.startsWith('ELECTRON_')) delete env[key]
  }
  return env
}

function sameOrigin(next) {
  if (readyOrigin === null) return true
  try {
    return new URL(next).origin === readyOrigin
  } catch {
    return false
  }
}

function showFailure(message) {
  if (failed) return
  failed = true
  if (readyTimer !== null) clearTimeout(readyTimer)
  const detail = redact(message)
  const box = dialog.showMessageBox({
    type: 'error',
    title: 'dsh-linux',
    message: 'dsh web did not stay up',
    detail: detail.slice(0, 4000),
    buttons: ['Quit'],
  })
  void box.finally(() => {
    void stopChild().finally(() => app.exit(1))
  })
}

function openWindow(url) {
  if (window !== null) {
    void window.loadURL(url)
    window.show()
    return
  }
  window = new BrowserWindow({
    width: 1280,
    height: 840,
    title: 'dsh-linux',
    backgroundColor: '#111111',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  })
  window.removeMenu()
  window.on('page-title-updated', (event) => {
    event.preventDefault()
    window?.setTitle('dsh-linux')
  })
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    if (!isLoopbackUrl(target)) {
      try {
        const parsed = new URL(target)
        if (parsed.protocol !== 'https:') return { action: 'deny' }
      } catch {
        return { action: 'deny' }
      }
    }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        parent: window ?? undefined,
        title: 'dsh-linux',
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
        },
      },
    }
  })
  window.webContents.on('will-navigate', (event, target) => {
    let parsed
    try {
      parsed = new URL(target)
    } catch {
      event.preventDefault()
      return
    }
    if (parsed.origin === readyOrigin) return
    if (parsed.protocol === 'https:') return
    event.preventDefault()
  })
  window.on('closed', () => {
    window = null
  })
  void window.loadURL(url)
}

function acceptReady(url) {
  if (!isLoopbackUrl(url) || !sameOrigin(url)) {
    showFailure(`refusing non-loopback or cross-origin ready URL\n\n${redact(url)}`)
    return
  }
  const first = readyUrl === null
  readyUrl = url
  readyOrigin = new URL(url).origin
  if (readyTimer !== null) {
    clearTimeout(readyTimer)
    readyTimer = null
  }
  const host = new URL(url).host
  remember(first ? `dsh-linux: ready on ${host}` : `dsh-linux: new token on ${host}`)
  openWindow(url)
}

function onLine(line) {
  const url = parseReadyLine(line)
  if (url !== null) acceptReady(url)
  else remember(line)
}

function attach(stream) {
  let buffer = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    buffer += chunk
    let newline = buffer.indexOf('\n')
    while (newline !== -1) {
      onLine(buffer.slice(0, newline).replace(/\r$/, ''))
      buffer = buffer.slice(newline + 1)
      newline = buffer.indexOf('\n')
    }
    if (buffer.length > 1_000_000) buffer = buffer.slice(-10_000)
  })
}

function stopChild() {
  const current = child
  if (current === null || current.pid === undefined || current.exitCode !== null) {
    return Promise.resolve()
  }
  stopping = true
  try {
    process.kill(-current.pid, 'SIGTERM')
  } catch {
    try { current.kill('SIGTERM') } catch { /* already gone */ }
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      try { process.kill(-current.pid, 'SIGKILL') } catch { /* already gone */ }
      resolve()
    }, TERM_MS)
    current.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

function installRefererGuard() {
  // The launch credential is a query parameter. A later https login must not receive it as Referer.
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders }
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase() !== 'referer') continue
      headers[name] = stripTokenQuery(headers[name])
    }
    callback({ requestHeaders: headers })
  })
}

function boot() {
  installRefererGuard()
  let port
  let bin
  try {
    port = parsePort(process.argv, process.env)
    bin = dshBin()
  } catch (error) {
    showFailure(error instanceof Error ? error.message : String(error))
    return
  }
  remember(`dsh-linux: starting dsh web --no-open --port ${String(port)}`)
  // detached: the CLI and the workers it forks share a group we can signal
  // without signaling Electron. process.execPath is Electron, so the binary is `node`.
  child = spawn('node', [bin, 'web', '--no-open', '--port', String(port)], {
    cwd: projectRoot,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: childEnv(),
  })
  if (child.stdout) attach(child.stdout)
  if (child.stderr) attach(child.stderr)
  child.once('error', (error) => {
    showFailure(`failed to start node: ${error.message}`)
  })
  child.once('exit', (code, signal) => {
    if (stopping || failed) return
    const why = signal ?? String(code)
    showFailure(`dsh exited (${why}) before the window was done with it\n\n${tail.join('\n')}`)
  })
  readyTimer = setTimeout(() => {
    if (readyUrl !== null || failed) return
    showFailure(`no \`dsh web:\` URL within ${String(READY_MS / 1000)}s\n\n${tail.join('\n')}`)
  }, READY_MS)
}

app.on('second-instance', () => {
  if (window === null) return
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
})

app.on('before-quit', (event) => {
  if (child === null || child.exitCode !== null || stopping) return
  event.preventDefault()
  void stopChild().finally(() => app.quit())
})

app.on('window-all-closed', () => {
  app.quit()
})

if (ownsInstance) {
  app.whenReady().then(boot).catch((error) => {
    showFailure(error instanceof Error ? error.message : String(error))
  })
}
