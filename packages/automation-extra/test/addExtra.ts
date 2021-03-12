import test from 'ava'

import { _addExtra } from '../src/index'

const fakebrowser = {
  on() {
    return null
  }
}

const dummyLauncher = {
  launch: () => fakebrowser
} as any

test('is a function', async t => {
  t.is(typeof _addExtra, 'function')
})

test('is an instance of Function', async t => {
  t.is(_addExtra.constructor.name, 'Function')
})

test('will throw without object', async t => {
  t.throws(
    () => _addExtra(null as any),
    null,
    'No puppeteer instance provided.'
  )
})

test('returns an instance of PuppeteerExtra', async t => {
  t.is(_addExtra(dummyLauncher).constructor.name, 'PuppeteerExtra')
})
test('pipes launch through to the launcher', async t => {
  const result = await _addExtra(dummyLauncher).launch()
  t.is(result, fakebrowser as any)
})
