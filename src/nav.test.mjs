import assert from 'node:assert/strict'
import test from 'node:test'
import { allowMainNavigation, allowPopupNavigation, classifyOpen } from './nav.mjs'

const origin = 'http://127.0.0.1:3080'

test('sign-in preopens about:blank inside the shell', () => {
  assert.equal(classifyOpen('about:blank'), 'internal')
  assert.equal(classifyOpen(''), 'internal')
  assert.equal(classifyOpen('http://127.0.0.1:3080/chat'), 'internal')
})

test('ordinary links leave to the system browser', () => {
  assert.equal(classifyOpen('https://platform.deepseek.com/login'), 'external')
  assert.equal(classifyOpen('mailto:brwsk@protonmail.com'), 'external')
})

test('script and file opens are refused', () => {
  assert.equal(classifyOpen('javascript:alert(1)'), 'deny')
  assert.equal(classifyOpen('file:///home/brwsk/.dsh/.env'), 'deny')
  assert.equal(classifyOpen('data:text/html,hi'), 'deny')
  assert.equal(classifyOpen('not a url'), 'deny')
})

test('the main window cannot be navigated off the harness origin', () => {
  assert.equal(allowMainNavigation('http://127.0.0.1:3080/settings', origin), true)
  assert.equal(allowMainNavigation('https://evil.example/phish', origin), false)
  assert.equal(allowMainNavigation('file:///tmp/x', origin), false)
  assert.equal(allowMainNavigation('http://127.0.0.1:3090/', origin), false)
})

test('the sign-in popup may replace about:blank with https or loopback', () => {
  assert.equal(allowPopupNavigation('about:blank'), true)
  assert.equal(allowPopupNavigation('https://platform.deepseek.com/oauth?theme=dark'), true)
  assert.equal(allowPopupNavigation('http://127.0.0.1:3080/'), true)
  assert.equal(allowPopupNavigation('javascript:alert(1)'), false)
  assert.equal(allowPopupNavigation('file:///home/brwsk/.dsh/credentials.json'), false)
})
