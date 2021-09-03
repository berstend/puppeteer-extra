import test from 'ava'

import RecaptchaPlugin from './index'

import { addExtra } from 'puppeteer-extra'

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

const getBrowser = async (url = '', opts = {}) => {
  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin(opts)
  puppeteer.use(recaptchaPlugin)
  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
    defaultViewport: null
  })
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle0' })
  return { browser, page }
}

test('will correctly detect v2-checkbox-auto.html', async t => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-auto.html'
  const { browser, page } = await getBrowser(url)
  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.is(c._vendor, 'recaptcha')
  t.is(c._type, 'checkbox')
  t.is(c.url, url)

  t.true(c.sitekey && c.sitekey.length > 5)
  t.is(c.widgetId, 0)
  t.not(c.display, undefined)
  t.is(c.callback, undefined)

  t.is(c.hasResponseElement, true)
  t.is(c.isEnterprise, false)
  t.is(c.isInViewport, true)
  t.is(c.isInvisible, false)

  await browser.close()
})

test('will correctly detect v2-checkbox-auto-nowww.html', async t => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-auto-nowww.html'
  const { browser, page } = await getBrowser(url)
  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.is(c._vendor, 'recaptcha')
  t.is(c.callback, undefined)
  t.is(c.hasResponseElement, true)
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.is(c.widgetId, 0)
  t.not(c.display, undefined)

  await browser.close()
})

test('will correctly detect v2-checkbox-auto-recaptchadotnet.html', async t => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-auto-recaptchadotnet.html'
  const { browser, page } = await getBrowser(url)
  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.is(c._vendor, 'recaptcha')
  t.is(c.callback, undefined)
  t.is(c.hasResponseElement, true)
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.is(c.widgetId, 0)
  t.not(c.display, undefined)

  await browser.close()
})

test('will correctly detect enterprise-checkbox-auto.html', async t => {
  const url =
    'https://berstend.github.io/static/recaptcha/enterprise-checkbox-auto.html'
  const { browser, page } = await getBrowser(url)
  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.is(c._vendor, 'recaptcha')
  t.is(c.callback, undefined)
  t.is(c.isEnterprise, true)
  t.is(c.hasResponseElement, true)
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.is(c.widgetId, 0)
  t.not(c.display, undefined)

  await browser.close()
})

test('will correctly detect enterprise-checkbox-auto-recaptchadotnet.html', async t => {
  const url =
    'https://berstend.github.io/static/recaptcha/enterprise-checkbox-auto-recaptchadotnet.html'
  const { browser, page } = await getBrowser(url)
  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.is(c._vendor, 'recaptcha')
  t.is(c.callback, undefined)
  t.is(c.isEnterprise, true)
  t.is(c.hasResponseElement, true)
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.is(c.widgetId, 0)
  t.not(c.display, undefined)

  await browser.close()
})

test('will correctly detect enterprise-checkbox-explicit.html', async t => {
  const url =
    'https://berstend.github.io/static/recaptcha/enterprise-checkbox-explicit.html'
  const { browser, page } = await getBrowser(url)
  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.is(c._vendor, 'recaptcha')
  t.is(c.callback, undefined)
  t.is(c.action, 'homepage') // NOTE
  t.is(c.isEnterprise, true)
  t.is(c.hasResponseElement, true)
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.is(c.widgetId, 0)
  t.not(c.display, undefined)

  await browser.close()
})

test('will correctly detect v2-invisible-explicit-isolated.html', async t => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-invisible-explicit-isolated.html'
  const { browser, page } = await getBrowser(url, {
    solveInactiveChallenges: true
  })
  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.not(c.display, undefined)
  t.not(c.id, undefined)

  delete c.url
  delete c.sitekey
  delete c.display
  delete c.id

  t.deepEqual(c, {
    callback: 'onSubmit',
    _vendor: 'recaptcha',
    s: null,
    widgetId: 100000,
    hasResponseElement: true,
    isEnterprise: false,
    isInViewport: true,
    isInvisible: true,
    _type: 'invisible',
    hasActiveChallengePopup: false,
    hasChallengeFrame: true
  })

  await browser.close()
})

test('will correctly detect v2-invisible-auto.html - active challenge', async t => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-invisible-explicit.html'
  const { browser, page } = await getBrowser('about:blank')
  await page.setUserAgent('BOT') // we want to trigger the invisible recaptcha challenge window
  await page.goto(url, { waitUntil: 'networkidle2' })

  if (page.waitForTimeout) {
    await page.waitForTimeout(1000)
  } else {
    await page.waitFor(1000)
  }

  await page.click('#submit')

  if (page.waitForTimeout) {
    await page.waitForTimeout(1000)
  } else {
    await page.waitFor(1000)
  }

  if (page.url() !== url) {
    // we didn't get a challenge
    t.truthy('foo')
    return
  }

  const { captchas, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)

  const c = captchas[0]
  t.true(c.sitekey && c.sitekey.length > 5)
  t.not(c.display, undefined)
  t.not(c.id, undefined)

  delete c.url
  delete c.sitekey
  delete c.display
  delete c.id

  t.deepEqual(c, {
    callback: 'onSubmit',
    _vendor: 'recaptcha',
    s: null,
    widgetId: 0,
    hasResponseElement: true,
    isEnterprise: false,
    isInViewport: true,
    isInvisible: true,
    _type: 'invisible',
    hasActiveChallengePopup: true, // the important bit
    hasChallengeFrame: true
  })

  await browser.close()
})

test('will correctly detect v3-programmatic.html with solveScoreBased:false and filter captcha', async t => {
  const url = 'https://berstend.github.io/static/recaptcha/v3-programmatic.html'
  const { browser, page } = await getBrowser(url, {
    solveScoreBased: false
  })
  const { captchas, filtered, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 0)
  t.is(filtered.length, 1)

  const c = filtered[0]
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.not(c.display, undefined)
  t.not(c.id, undefined)

  delete c.url
  delete c.sitekey
  delete c.display
  delete c.id

  t.deepEqual(c, {
    _vendor: 'recaptcha',
    s: null,
    widgetId: 100000,
    hasResponseElement: true,
    isEnterprise: false,
    isInViewport: true,
    isInvisible: true,
    _type: 'score',
    hasActiveChallengePopup: false,
    hasChallengeFrame: false, // important
    filtered: true, // important
    filteredReason: 'solveScoreBased' // important
  })

  await browser.close()
})

test('will correctly detect v3-programmatic.html with solveScoreBased:true', async t => {
  const url = 'https://berstend.github.io/static/recaptcha/v3-programmatic.html'
  const { browser, page } = await getBrowser(url, {
    solveScoreBased: true
  })
  const { captchas, filtered, error } = await (page as any).findRecaptchas()
  t.is(error, null)
  t.is(captchas.length, 1)
  t.is(filtered.length, 0)

  const c = captchas[0]
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.not(c.display, undefined)
  t.not(c.id, undefined)

  delete c.url
  delete c.sitekey
  delete c.display
  delete c.id

  t.deepEqual(c, {
    _vendor: 'recaptcha',
    s: null,
    widgetId: 100000,
    hasResponseElement: true,
    isEnterprise: false,
    isInViewport: true,
    isInvisible: true,
    _type: 'score',
    hasActiveChallengePopup: false,
    hasChallengeFrame: false // important
  })

  await browser.close()
})
