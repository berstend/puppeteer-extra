import test from 'ava'

import { addExtra } from '..'

test.serial('is a function', async t => {
  t.is(typeof addExtra, 'function')
})

test.serial('is an instance of Function', async t => {
  t.is(addExtra.constructor.name, 'Function')
})

test.serial('returns an object', async t => {
  t.is(typeof addExtra(null as any), 'object')
})

test.serial('returns an instance of PuppeteerExtra', async t => {
  t.is(addExtra(null as any).constructor.name, 'PuppeteerExtra')
})

test.serial('will throw without puppeteer', async t => {
  const pptr = addExtra(null as any)
  t.throws(() => pptr.pptr, undefined, 'No puppeteer instance provided.')
})
// puppeteer-firefox RIP
// test('can work with puppeteer-firefox', async t => {
//   const pptrFF = require('puppeteer-firefox')
//   const puppeteer = addExtra(pptrFF)
//   t.truthy(Array.isArray(puppeteer.plugins))
//   const browser = await puppeteer.launch({ headless: true })
//   t.truthy(await browser.version())
//   const page = await browser.newPage()
//   await page.goto('https://example.com')
//   const title = await page.title()
//   t.true(title && title.toLowerCase().includes('example domain'))
//   await browser.close()
//   t.true(true)
// })
