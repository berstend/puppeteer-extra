const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('./util')
const Plugin = require('..')

// Fix CI issues with old versions
const isOldPuppeteerVersion = () => {
  const version = process.env.PUPPETEER_VERSION
  const isOld = version && (version === '1.9.0' || version === '1.6.2')
  return isOld
}

/* global HTMLIFrameElement */
/* global Notification */
test('stealth: will pass Paul Irish', async t => {
  const browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true })
  const page = await browser.newPage()
  const detectionResults = await page.evaluate(detectHeadless)
  await browser.close()

  if (isOldPuppeteerVersion()) {
    t.true(true)
    return
  }

  const wasHeadlessDetected = Object.values(detectionResults).some(Boolean)
  if (wasHeadlessDetected) {
    console.log(detectionResults)
  }
  t.false(wasHeadlessDetected)
})

async function detectHeadless() {
  const results = {}

  async function test(name, fn) {
    const detectionPassed = await fn()
    if (detectionPassed) console.log(`Chrome headless detected via ${name}`)
    results[name] = detectionPassed
  }

  await test('userAgent', _ => {
    return /HeadlessChrome/.test(window.navigator.userAgent)
  })

  // Detects the --enable-automation || --headless flags
  // Will return true in headful if --enable-automation is provided
  await test('navigator.webdriver present', _ => {
    return 'webdriver' in navigator
  })

  await test('window.chrome missing', _ => {
    return /Chrome/.test(window.navigator.userAgent) && !window.chrome
  })

  await test('permissions API', async _ => {
    const permissionStatus = await navigator.permissions.query({
      name: 'notifications'
    })
    return (
      Notification.permission === 'denied' &&
      permissionStatus.state === 'prompt'
    )
  })

  await test('permissions API overriden', _ => {
    const permissions = window.navigator.permissions
    if (permissions.query.toString() !== 'function query() { [native code] }')
      return true
    if (
      permissions.query.toString.toString() !==
      'function toString() { [native code] }'
    )
      return true
    if (
      permissions.query.toString.hasOwnProperty('[[Handler]]') && // eslint-disable-line
      permissions.query.toString.hasOwnProperty('[[Target]]') && // eslint-disable-line
      permissions.query.toString.hasOwnProperty('[[IsRevoked]]') // eslint-disable-line
    )
      return true
    if (permissions.hasOwnProperty('query')) return true // eslint-disable-line
  })

  await test('navigator.plugins empty', _ => {
    return navigator.plugins.length === 0
  })

  await test('navigator.languages blank', _ => {
    return navigator.languages === ''
  })

  await test('iFrame for fresh window object', _ => {
    // evaluateOnNewDocument scripts don't apply within [srcdoc] (or [sandbox]) iframes
    // https://github.com/GoogleChrome/puppeteer/issues/1106#issuecomment-359313898
    const iframe = document.createElement('iframe')
    iframe.srcdoc = 'page intentionally left blank'
    document.body.appendChild(iframe)

    // Verify iframe prototype isn't touched
    const descriptors = Object.getOwnPropertyDescriptors(
      HTMLIFrameElement.prototype
    )

    if (
      descriptors.contentWindow.get.toString() !==
      'function get contentWindow() { [native code] }'
    )
      return true
    // Verify iframe isn't remapped to main window
    if (iframe.contentWindow === window) return true

    // Here we would need to rerun all tests with `iframe.contentWindow` as `window`
    // Example:
    return iframe.contentWindow.navigator.plugins.length === 0
  })

  // This detects that a devtools protocol agent is attached.
  // So it will also pass true in headful Chrome if the devtools window is attached
  await test('toString', _ => {
    let gotYou = 0
    const spooky = /./
    spooky.toString = function() {
      gotYou++
      return 'spooky'
    }
    console.debug(spooky)
    return gotYou > 1
  })

  return results
}
