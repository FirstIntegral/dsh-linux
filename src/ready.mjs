/** Pure boot-line helpers. No Electron, no network, no token storage. */

const READY_LINE = /^dsh web: (https?:\/\/\S+)\s*$/

/**
 * @param {string} line one stdout line, without the trailing newline
 * @returns {string | null} authenticated URL, or null when the line is not the ready signal
 */
export function parseReadyLine(line) {
  const match = READY_LINE.exec(line.trim())
  return match ? match[1] : null
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isLoopbackUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  return host === '127.0.0.1' || host === 'localhost' || host === '::1'
}

const SENSITIVE_QUERY = new Set([
  'token',
  'api_key',
  'apikey',
  'api-key',
  'access_token',
  'refresh_token',
  'secret',
  'password',
])

/**
 * Drop credential query params before a URL is used as a Referer.
 * Path and origin stay. Ordinary params stay.
 * @param {string} value
 * @returns {string}
 */
export function stripTokenQuery(value) {
  try {
    const url = new URL(value)
    let dropped = false
    for (const name of [...url.searchParams.keys()]) {
      if (!SENSITIVE_QUERY.has(name.toLowerCase())) continue
      url.searchParams.delete(name)
      dropped = true
    }
    return dropped ? url.href : value
  } catch {
    return value
  }
}

/**
 * Replace any URL so a log line cannot carry the launch token.
 * @param {string} text
 * @returns {string}
 */
export function redact(text) {
  const urls = text.replace(/https?:\/\/\S+/g, (raw) => {
    try {
      const url = new URL(raw)
      return `${url.origin}/[redacted]`
    } catch {
      return '[redacted-url]'
    }
  })
  return urls
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, 'sk-[redacted]')
    .replace(
      /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\s*[=:]\s*)(['"]?)[^\s'"]+/gi,
      '$1$2[redacted]',
    )
}

/**
 * @param {readonly string[]} argv
 * @param {NodeJS.ProcessEnv} env
 * @returns {number}
 */
export function parsePort(argv, env) {
  const flag = argv.indexOf('--port')
  let raw
  if (flag === -1) raw = env.DSH_LINUX_PORT
  else raw = argv[flag + 1]
  if (flag !== -1 && (raw === undefined || raw === '')) {
    throw new Error('dsh-linux: --port must be an integer from 1 through 65535')
  }
  if (raw === undefined || raw === '') return 3080
  if (!/^[0-9]+$/.test(raw)) {
    throw new Error('dsh-linux: --port must be an integer from 1 through 65535')
  }
  const port = Number(raw)
  if (port < 1 || port > 65535) {
    throw new Error('dsh-linux: --port must be an integer from 1 through 65535')
  }
  return port
}
