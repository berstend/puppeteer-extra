import test from 'ava'

import { addExtra } from '../src/index'

test('is a function', async t => {
  t.is(typeof addExtra, 'function')
})

test('is an instance of Function', async t => {
  t.is(addExtra.constructor.name, 'Function')
})

test('returns an object', async t => {
  t.is(typeof addExtra(null as any), 'object')
})

test('returns an instance of PuppeteerExtra', async t => {
  t.is(addExtra(null as any).constructor.name, 'PuppeteerExtra')
})

test('will throw without puppeteer', async t => {
  const pptr = addExtra(null as any)
  t.throws(() => pptr.pptr, null, 'No puppeteer instance provided.')
})
