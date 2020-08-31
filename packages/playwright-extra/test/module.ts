import test from 'ava'

import pwModule from '../src/index'

test('is an object', async t => {
  t.is(typeof pwModule, 'object')
})

test('should have the additional exports', async t => {
  t.true(pwModule.errors instanceof Object)
  t.true(pwModule.selectors instanceof Object)
  t.true(pwModule.devices instanceof Object)
})

test('should have the launcher exports wrapped', async t => {
  t.true(pwModule.chromium instanceof Object)
  t.true(pwModule.firefox instanceof Object)
  t.true(pwModule.webkit instanceof Object)

  t.is(pwModule.chromium.productName, 'chromium')
  t.is(pwModule.firefox.productName, 'firefox')
  t.is(pwModule.webkit.productName, 'webkit')
})
