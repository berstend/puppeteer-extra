/* global Notification */
const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const { vanillaPuppeteer, addExtra } = require('../../test/util')

const Plugin = require('.')

test('vanilla: is prompt', async t => {
  const { permissions } = await getVanillaFingerPrint()
  t.deepEqual(permissions, {
    permission: 'denied',
    state: 'prompt' // this is WRONG behavior, it's "denied" in headful!
  })
})

test('stealth: is denied', async t => {
  const { permissions } = await getStealthFingerPrint(Plugin)
  t.deepEqual(permissions, {
    permission: 'denied',
    state: 'denied' // this is FIXED behavior, it's "denied" in headful!
  })
})

async function getNotificationPermission() {
  const { state, onchange } = await navigator.permissions.query({
    name: 'notifications'
  })
  return {
    state,
    onchange,
    permission: Notification.permission
  }
}

test('vanilla headful: as expected', async t => {
  const puppeteer = addExtra(vanillaPuppeteer)
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  const result = await page.evaluate(getNotificationPermission)
  t.deepEqual(result, {
    state: 'denied',
    onchange: null,
    permission: 'denied'
  })

  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded'
  })
  const result2 = await page.evaluate(getNotificationPermission)
  t.deepEqual(result2, {
    state: 'prompt',
    onchange: null,
    permission: 'default'
  })
})

test('vanilla headless: as expected', async t => {
  const puppeteer = addExtra(vanillaPuppeteer)
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const result = await page.evaluate(getNotificationPermission)
  t.deepEqual(result, {
    state: 'prompt', // should be denied
    onchange: null,
    permission: 'denied'
  })

  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded'
  })

  const result2 = await page.evaluate(getNotificationPermission)
  t.deepEqual(result2, {
    state: 'prompt',
    onchange: null,
    permission: 'denied' // should be default
  })
})

test('stealth headless: as vanilla headful', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const result = await page.evaluate(getNotificationPermission)
  t.deepEqual(result, {
    state: 'denied',
    onchange: null,
    permission: 'denied'
  })

  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded'
  })

  const result2 = await page.evaluate(getNotificationPermission)
  t.deepEqual(result2, {
    state: 'prompt',
    onchange: null,
    permission: 'default'
  })
})
