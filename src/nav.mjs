/** Where a window.open may go. No Electron, no network. */

import { isLoopbackUrl } from './ready.mjs'

/**
 * @param {string} target
 * @returns {'internal' | 'external' | 'deny'}
 */
export function classifyOpen(target) {
  if (target === '' || target === 'about:blank' || target === 'about:blank/') return 'internal'
  let url
  try {
    url = new URL(target)
  } catch {
    return 'deny'
  }
  if (url.protocol === 'about:' && url.pathname === 'blank') return 'internal'
  if (isLoopbackUrl(target)) return 'internal'
  if (url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:') return 'external'
  return 'deny'
}

/**
 * The main window stays on the harness origin. Login leaves via a popup.
 * @param {string} target
 * @param {string} origin
 * @returns {boolean}
 */
export function allowMainNavigation(target, origin) {
  let url
  try {
    url = new URL(target)
  } catch {
    return false
  }
  return url.origin === origin
}

/**
 * A popup may sit on about:blank, then follow an http(s) or loopback URL.
 * javascript:, file:, and data: stay closed.
 * @param {string} target
 * @returns {boolean}
 */
export function allowPopupNavigation(target) {
  let url
  try {
    url = new URL(target)
  } catch {
    return false
  }
  if (url.protocol === 'about:' && url.pathname === 'blank') return true
  if (url.protocol === 'https:' || url.protocol === 'http:') return true
  return isLoopbackUrl(target)
}
