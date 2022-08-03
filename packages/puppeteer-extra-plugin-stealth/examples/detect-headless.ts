// taken from: https://github.com/paulirish/headless-cat-n-mouse/blob/master/detect-headless.js
// initial detects from @antoinevastel

// import { JSHandle } from "puppeteer";

//   http://antoinevastel.github.io/bot%20detection/2018/01/17/detect-chrome-headless-v2.html

/**
 * will be evaluated in the browser context
 */
export default async function() {
  const results: {[key: string]: boolean} = {}

  async function test(name: string, fn: () => boolean | Promise<boolean>): Promise<void> {
    const detectionPassed = await fn()
    if (detectionPassed) {
      console.log(`WARNING: Chrome headless detected via ${name}`)
    } else {
      console.log(`PASS: Chrome headless NOT detected via ${name}`)
    }
    results[name] = detectionPassed
  }

  await test('userAgent', () => {
    return /HeadlessChrome/.test(window.navigator.userAgent)
  })

  // Detects the --enable-automation || --headless flags
  // Will return true in headful if --enable-automation is provided
  await test('navigator.webdriver present', () => {
    return 'webdriver' in navigator
  })

  await test('window.chrome missing', () => {
    return /Chrome/.test(window.navigator.userAgent) && !(window as any).chrome
  })

  await test('permissions API', async () => {
    const permissionStatus = await navigator.permissions.query({
      name: 'notifications'
    })
    return (
      Notification.permission === 'denied' &&
      permissionStatus.state === 'prompt'
    )
  })

  await test('permissions API overriden', () => {
    const permissions = window.navigator.permissions
    if (permissions.query.toString() !== 'function query() { [native code] }')
      return true
    if (
      permissions.query.toString.toString() !==
      'function toString() { [native code] }'
    )
      return true
    if (
      permissions.query.toString.hasOwnProperty('[[Handler]]') && // eslint-disable-line no-prototype-builtins
      permissions.query.toString.hasOwnProperty('[[Target]]') && // eslint-disable-line no-prototype-builtins
      permissions.query.toString.hasOwnProperty('[[IsRevoked]]') // eslint-disable-line no-prototype-builtins
    )
      return true
    if (permissions.hasOwnProperty('query')) return true // eslint-disable-line no-prototype-builtins
    return false
  })

  await test('navigator.plugins empty', () => {
    return navigator.plugins.length === 0
  })

  await test('navigator.languages blank', () => {
    // console.log( (navigator.languages as unknown as JSHandle).toString() )
    return (navigator as any).languages === ''
  })

  await test('iFrame for fresh window object', () => {
    // evaluateOnNewDocument scripts don't apply within [srcdoc] (or [sandbox]) iframes
    // https://github.com/GoogleChrome/puppeteer/issues/1106#issuecomment-359313898
    const iframe = document.createElement('iframe')
    iframe.srcdoc = 'page intentionally left blank'
    document.body.appendChild(iframe)

    // Here we would need to rerun all tests with `iframe.contentWindow` as `window`
    // Example:
    return iframe.contentWindow!.navigator.plugins.length === 0
  })

  // This detects that a devtools protocol agent is attached.
  // So it will also pass true in headful Chrome if the devtools window is attached
  await test('toString', () => {
    let gotYou = 0
    const spooky = /./
    spooky.toString = function() {
      gotYou++
      return 'spooky'
    }
    return gotYou > 1
  })

  return results
}
