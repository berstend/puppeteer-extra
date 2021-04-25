import test from 'ava'

import RecaptchaPlugin from './index'

import { addExtra } from 'puppeteer-extra'

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

const getBrowser = async (url = '') => {
  const puppeteer = addExtra(require('puppeteer'))
  const recaptchaPlugin = RecaptchaPlugin()
  puppeteer.use(recaptchaPlugin)
  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true
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
  t.is(c.callback, undefined)
  t.is(c.isEnterprise, undefined)
  t.is(c.hasResponseElement, true)
  t.is(c.url, url)
  t.true(c.sitekey && c.sitekey.length > 5)
  t.is(c.widgetId, 0)
  t.not(c.display, undefined)

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
