import assert from 'node:assert/strict'
import test from 'node:test'
import { isLoopbackUrl, parsePort, parseReadyLine, redact, stripTokenQuery } from './ready.mjs'

test('ready line is the authenticated URL and nothing else', () => {
  assert.equal(
    parseReadyLine('dsh web: http://127.0.0.1:3080/?token=secret'),
    'http://127.0.0.1:3080/?token=secret',
  )
  assert.equal(parseReadyLine('dsh web: opening the default browser; pass --no-open to disable'), null)
  assert.equal(parseReadyLine('listening on http://127.0.0.1:3080/'), null)
})

test('only loopback http(s) may load', () => {
  assert.equal(isLoopbackUrl('http://127.0.0.1:3080/x?t=1'), true)
  assert.equal(isLoopbackUrl('https://localhost:3080/'), true)
  assert.equal(isLoopbackUrl('http://[::1]:3080/'), true)
  assert.equal(isLoopbackUrl('http://0.0.0.0:3080/'), false)
  assert.equal(isLoopbackUrl('http://10.0.0.8:3080/'), false)
  assert.equal(isLoopbackUrl('file:///tmp/index.html'), false)
  assert.equal(isLoopbackUrl('not a url'), false)
})

test('referer keeps origin and drops only the token query', () => {
  assert.equal(
    stripTokenQuery('http://127.0.0.1:3080/?token=secret'),
    'http://127.0.0.1:3080/',
  )
  assert.equal(
    stripTokenQuery('http://127.0.0.1:3080/?a=1&token=secret'),
    'http://127.0.0.1:3080/?a=1',
  )
  assert.equal(stripTokenQuery('https://example.com/login'), 'https://example.com/login')
})

test('redact keeps origin only', () => {
  assert.equal(
    redact('dsh web: http://127.0.0.1:3080/login?token=secret'),
    'dsh web: http://127.0.0.1:3080/[redacted]',
  )
})

test('port flag, env, default, and garbage', () => {
  assert.equal(parsePort([], {}), 3080)
  assert.equal(parsePort(['--port', '8080'], {}), 8080)
  assert.equal(parsePort([], { DSH_LINUX_PORT: '3090' }), 3090)
  assert.throws(() => parsePort(['--port', 'nope'], {}), /integer/)
  assert.throws(() => parsePort(['--port', '0'], {}), /integer/)
  assert.throws(() => parsePort(['--port'], {}), /integer/)
})
