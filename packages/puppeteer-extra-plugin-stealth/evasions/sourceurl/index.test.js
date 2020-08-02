const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

const TEST_HTML_FILE = require('path').join(__dirname, './_fixtures/test.html')

test('vanilla: sourceurl is leaking', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('file://' + TEST_HTML_FILE, { waitUntil: 'load' })

  // Trigger test
  await page.$('title')

  const result = await page.evaluate(
    () => document.querySelector('#result').innerText
  )
  t.is(result, 'FAIL')
})

test('stealth: sourceurl is not leaking', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('file://' + TEST_HTML_FILE, { waitUntil: 'load' })

  // Trigger test
  await page.$('title')

  const result = await page.evaluate(
    () => document.querySelector('#result').innerText
  )
  t.is(result, 'PASS')
})
