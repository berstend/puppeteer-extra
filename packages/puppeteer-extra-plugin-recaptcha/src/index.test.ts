import test from 'ava'

import RecaptchaPlugin from './index'
// import * as types from './types'

// import { Puppeteer } from './puppeteer-mods'

import { addExtra } from 'puppeteer-extra'

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test('will detect reCAPTCHAs', async t => {
  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin()
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const url = 'https://www.google.com/recaptcha/api2/demo'
  await page.goto(url, { waitUntil: 'networkidle0' })

  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.is(c._vendor, 'recaptcha')
  t.is(c.callback, 'onSuccess')
  t.is(c.hasResponseElement, true)
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)

  await browser.close()
})

test('will detect hCAPTCHAs', async t => {
  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin()
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const urls = [
    'https://accounts.hcaptcha.com/demo',
    'https://democaptcha.com/demo-form-eng/hcaptcha.html'
  ]

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle0' })

    const { captchas, error } = await (page as any).findRecaptchas()
    t.is(error, null)
    t.is(captchas.length, 1)

    const c = captchas[0]
    t.is(c._vendor, 'hcaptcha')
    t.is(c.url, url)
    t.true(c.sitekey && c.sitekey.length > 5)
  }

  await browser.close()
})

test('will detect active hCAPTCHA challenges', async t => {
  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin()
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const urls = [
    'https://accounts.hcaptcha.com/demo',
    'https://democaptcha.com/demo-form-eng/hcaptcha.html'
  ]

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle0' })
    await page.evaluate(() => (window as any).hcaptcha.execute()) // trigger challenge popup
    await page.waitForTimeout(2 * 1000)
    await page.evaluate(() =>
      document
        .querySelector(`[data-hcaptcha-widget-id]:not([src*='invisible'])`)
        .remove()
    ) // remove regular checkbox so we definitely test against the popup

    const { captchas, error } = await (page as any).findRecaptchas()
    t.is(error, null)
    t.is(captchas.length, 1)

    const c = captchas[0]
    t.is(c._vendor, 'hcaptcha')
    t.is(c.url, url)
    t.true(c.sitekey && c.sitekey.length > 5)
  }

  await browser.close()
})

test('will not throw when no captchas are found', async t => {
  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin()
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const url = 'https://www.example.com'
  await page.goto(url, { waitUntil: 'networkidle0' })

  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 0)

  await browser.close()
})

// TODO: test/mock the rest
