import test from 'ava'

import RecaptchaPlugin from './index'

import { addExtra } from 'puppeteer-extra'

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test('will solve reCAPTCHAs', async (t) => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    t.truthy('foo')
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.')
    return
  }

  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
    },
  })
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  })
  const page = await browser.newPage()

  const url = 'https://www.google.com/recaptcha/api2/demo'
  await page.goto(url, { waitUntil: 'networkidle0' })

  const result = await (page as any).solveRecaptchas()

  const { captchas, solutions, solved, error } = result
  t.falsy(error)

  t.is(captchas.length, 1)
  t.is(solutions.length, 1)
  t.is(solved.length, 1)
  t.is(solved[0]._vendor, 'recaptcha')
  t.is(solved[0].isSolved, true)

  await browser.close()
})

test('will solve hCAPTCHAs', async (t) => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    t.truthy('foo')
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.')
    return
  }

  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
    },
  })
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  })
  const page = await browser.newPage()

  const url = 'http://democaptcha.com/demo-form-eng/hcaptcha.html'
  await page.goto(url, { waitUntil: 'networkidle0' })

  const result = await (page as any).solveRecaptchas()
  const { captchas, solutions, solved, error } = result
  t.falsy(error)

  t.is(captchas.length, 1)
  t.is(solutions.length, 1)
  t.is(solved.length, 1)
  t.is(solved[0]._vendor, 'hcaptcha')
  t.is(solved[0].isSolved, true)

  await browser.close()
})
