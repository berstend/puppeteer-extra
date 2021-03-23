import test from 'ava'

import { vanillaPuppeteer, addExtra, compareLooseVersionStrings } from './util'
import Plugin from '..'

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
  await page.exposeFunction('compareLooseVersionStrings', compareLooseVersionStrings)
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
  const results = {} as any

  async function test(name: string, fn: Function) {
    const detectionPassed = await fn()
    if (detectionPassed) console.log(`Chrome headless detected via ${name}`)
    results[name] = detectionPassed
  }

  await test('userAgent', (_: unknown) => {
    return /HeadlessChrome/.test(window.navigator.userAgent)
  })

  // navigator.webdriver behavior change since release 89.0.4339.0. See also #448
  if (await compareLooseVersionStrings(navigator.userAgent, '89.0.4339.0') >= 0) {
    await test('navigator.webdriver is not false', (_: unknown) => {
      return navigator.webdriver !== false
    })
  } else {
    // Detects the --enable-automation || --headless flags
    // Will return true in headful if --enable-automation is provided
    await test('navigator.webdriver present', (_: unknown) => {
      return 'webdriver' in navigator
    })

    await test('navigator.webdriver not undefined', (_: unknown) => {
      return navigator.webdriver !== undefined
    })

    /* eslint-disable no-proto */
    await test('navigator.webdriver property overridden', (_: unknown) => {
      return (
        Object.getOwnPropertyDescriptor((navigator as any).__proto__, 'webdriver') !==
        undefined
      )
    })

    await test('navigator.webdriver prop detected', (_: unknown) => {
      for (const prop in navigator) {
        if (prop === 'webdriver') {
          return true
        }
      }
      return false
    })
  }

  await test('window.chrome missing', (_: unknown) => {
    return /Chrome/.test(window.navigator.userAgent) && !window.chrome
  })

  await test('permissions API', async (_: unknown) => {
    const permissionStatus = await navigator.permissions.query({
      name: 'notifications'
    })
    return (
      Notification.permission === 'denied' &&
      permissionStatus.state === 'prompt'
    )
  })

  await test('permissions API overriden', (_: unknown) => {
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

  await test('navigator.plugins empty', (_: unknown) => {
    return navigator.plugins.length === 0
  })

  await test('navigator.languages blank', (_: unknown) => {
    return (navigator as any).languages === ''
  })

  await test('iFrame for fresh window object', (_: unknown) => {
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
      (descriptors.contentWindow as any).get.toString() !==
      'function get contentWindow() { [native code] }'
    )
      return true
    // Verify iframe isn't remapped to main window
    if (iframe.contentWindow === window) return true

    // Here we would need to rerun all tests with `iframe.contentWindow` as `window`
    // Example:
    return (iframe.contentWindow as any).navigator.plugins.length === 0
  })

  // This detects that a devtools protocol agent is attached.
  // So it will also pass true in headful Chrome if the devtools window is attached
  await test('toString', (_: unknown) => {
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
