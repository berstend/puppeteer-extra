const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const { Plugin } = require('.')

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
  // pptr 13-
  // Error: Test Error at test (file:///home/runner/work/puppeteer-extra-ts/puppeteer-extra-ts/packages/puppeteer-extra-plugin-stealth/evasions/sourceurl/_fixtures/test.html:13:21)
  // at HTMLDocument.querySelector (file:///home/runner/work/puppeteer-extra-ts/puppeteer-extra-ts/packages/puppeteer-extra-plugin-stealth/evasions/sourceurl/_fixtures/test.html:25:13)
  // at __puppeteer_evaluation_script__:1:17
  // pptr 14+
  // Error: Test Error at test (file:///home/runner/work/puppeteer-extra-ts/puppeteer-extra-ts/packages/puppeteer-extra-plugin-stealth/evasions/sourceurl/_fixtures/test.html:13:21)
  // at HTMLDocument.querySelector (file:///home/runner/work/puppeteer-extra-ts/puppeteer-extra-ts/packages/puppeteer-extra-plugin-stealth/evasions/sourceurl/_fixtures/test.html:25:13)
  // at pptr://__puppeteer_evaluation_script__:1:17'
  t.regex(result, /^FAIL/)
  const result2 = await page.evaluate(() => {
    try {
      Function.prototype.toString.apply({})
    } catch (err) {
      return err.stack
    }
  })
  t.true(result2.includes('__puppeteer_evaluation_script'))
})

test('stealth: sourceurl is not leaking', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(new Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('file://' + TEST_HTML_FILE, { waitUntil: 'load' })

  // Trigger test
  await page.$('title')

  const result = await page.evaluate(
    () => document.querySelector('#result').innerText
  )
  // TODO: fix that evasion

  // PPTR 13-
  // Error: Test Error at test (file:///home/runner/work/puppeteer-extra-ts/puppeteer-extra-ts/packages/puppeteer-extra-plugin-stealth/evasions/sourceurl/_fixtures/test.html:13:21)
  // at HTMLDocument.querySelector (file:///home/runner/work/puppeteer-extra-ts/puppeteer-extra-ts/packages/puppeteer-extra-plugin-stealth/evasions/sourceurl/_fixtures/test.html:25:13)
  // at :1:17

  // PPTR 14+
  // Error: Test Error at test (file:///home/runner/work/puppeteer-extra-ts/puppeteer-extra-ts/packages/puppeteer-extra-plugin-stealth/evasions/sourceurl/_fixtures/test.html:13:21)
  // at HTMLDocument.querySelector (file:///home/runner/work/puppeteer-extra-ts/puppeteer-extra-ts/packages/puppeteer-extra-plugin-stealth/evasions/sourceurl/_fixtures/test.html:25:13)
  // at pptr://__puppeteer_evaluation_script__:1:17'

  t.regex(result, /^PASS/)

  const result2 = await page.evaluate(() => {
    try {
      Function.prototype.toString.apply({})
    } catch (err) {
      return err.stack
    }
  })
  t.false(result2.includes('__puppeteer_evaluation_script'))
})
