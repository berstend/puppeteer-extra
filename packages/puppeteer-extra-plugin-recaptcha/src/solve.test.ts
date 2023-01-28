import test from 'ava'

import RecaptchaPlugin from './index'

import { addExtra } from 'puppeteer-extra'

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test('will solve reCAPTCHAs', async t => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    t.truthy('foo')
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.')
    return
  }

  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN
    }
  })
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
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

test('will solve hCAPTCHAs', async t => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    t.truthy('foo')
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.')
    return
  }

  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN
    }
  })
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const urls = [
    'https://accounts.hcaptcha.com/demo',
    'http://democaptcha.com/demo-form-eng/hcaptcha.html',
  ]

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle0' })

    const result = await (page as any).solveRecaptchas()
    const { captchas, solutions, solved, error } = result
    t.falsy(error)

    t.is(captchas.length, 1)
    t.is(solutions.length, 1)
    t.is(solved.length, 1)
    t.is(solved[0]._vendor, 'hcaptcha')
    t.is(solved[0].isSolved, true)
  }

  await browser.close()
})

test('will solve reCAPTCHA enterprise', async t => {
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
      opts: {
        useEnterpriseFlag: false // Not sure but using the enterprise flag makes it worse
      }
    }
  })
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const url =
    'https://berstend.github.io/static/recaptcha/enterprise-checkbox-explicit.html'
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

test('will solve multiple reCAPTCHAs', async t => {
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
      opts: {
        useEnterpriseFlag: false // Not sure but using the enterprise flag makes it worse
      }
    }
  })
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-explicit-multi.html'
  await page.goto(url, { waitUntil: 'networkidle0' })

  page.on('dialog', async dialog => {
    dialog.dismiss() // the test page has blocking `alert`s
  })

  const result = await (page as any).solveRecaptchas()

  const { captchas, solutions, solved, error } = result
  t.falsy(error)

  t.is(captchas.length, 3)
  t.is(solutions.length, 3)
  t.is(solved.length, 3)
  t.is(solved[0]._vendor, 'recaptcha')
  t.is(solved[0].isSolved, true)

  await browser.close()
})

test('will not solve inactive invisible reCAPTCHAs by default', async t => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    t.truthy('foo')
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.')
    return
  }

  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN
    }
  })
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const url =
    'https://berstend.github.io/static/recaptcha/v2-invisible-auto.html'
  await page.goto(url, { waitUntil: 'networkidle0' })

  const result = await (page as any).solveRecaptchas()

  const { captchas, solutions, solved, error } = result
  t.falsy(error)

  t.is(captchas.length, 0)
  t.is(solutions.length, 0)
  t.is(solved.length, 0)

  await browser.close()
})

test('will not solve score based reCAPTCHAs by default', async t => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    t.truthy('foo')
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.')
    return
  }

  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN
    }
  })
  puppeteer.use(recaptchaPlugin)

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
  })
  const page = await browser.newPage()

  const url = 'https://berstend.github.io/static/recaptcha/v3-programmatic.html'

  await page.goto(url, { waitUntil: 'networkidle0' })

  const result = await (page as any).solveRecaptchas()

  const { captchas, solutions, solved, error } = result
  t.falsy(error)

  t.is(captchas.length, 0)
  t.is(solutions.length, 0)
  t.is(solved.length, 0)

  await browser.close()
})
