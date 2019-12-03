const test = require('ava')

const vanillaPuppeteer = require('puppeteer')
const { addExtra } = require('puppeteer-extra')
const Plugin = require('.')

test('vanilla: is undefined', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const returnValue = await page.evaluate(() => console.debug('foo'))
  t.is(returnValue, undefined)
  await browser.close()
})

test('stealth: is null', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const returnValue = await page.evaluate(() => console.debug('foo'))
  t.is(returnValue, null)
  await browser.close()
})
