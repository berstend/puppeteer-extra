const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')
const { argsToIgnore } = require('.')

test('vanilla: uses args to ignore', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const client =
    typeof page._client === 'function' ? page._client() : page._client
  const { arguments: launchArgs } = await client.send(
    'Browser.getBrowserCommandLine'
  )
  const ok = argsToIgnore.every(arg => launchArgs.includes(arg))
  if (!ok) {
    console.log({ argsToIgnore, launchArgs })
  }
  t.is(ok, true)
})

test('stealth: does not use args to ignore', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const client =
    typeof page._client === 'function' ? page._client() : page._client
  const { arguments: launchArgs } = await client.send(
    'Browser.getBrowserCommandLine'
  )
  const ok = argsToIgnore.every(arg => !launchArgs.includes(arg))
  if (!ok) {
    console.log({ argsToIgnore, launchArgs })
  }
  t.is(ok, true)
})
