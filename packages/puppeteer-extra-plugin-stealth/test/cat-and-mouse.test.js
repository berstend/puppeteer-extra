const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('./util')
const Plugin = require('..')
const http = require('http')
const fs = require('fs')
const path = require('path')

// Fix CI issues with old versions
const isOldPuppeteerVersion = () => {
  const version = process.env.PUPPETEER_VERSION
  const isOld = version && (version === '1.9.0' || version === '1.6.2')
  return isOld
}

// Create a simple HTTP server. Service Workers cannot be served from file:// URIs
const httpServer = async () => {
  const server = await http
    .createServer((req, res) => {
      let contents, type

      if (req.url === '/sw.js') {
        contents = fs.readFileSync(path.join(__dirname, './fixtures/sw.js'))
        type = 'application/javascript'
      } else {
        contents = fs.readFileSync(
          path.join(__dirname, './fixtures/dummy-with-service-worker.html')
        )
        type = 'text/html'
      }

      res.setHeader('Content-Type', type)
      res.writeHead(200)
      res.end(contents)
    })
    .listen(0) // random free port

  return `http://127.0.0.1:${server.address().port}/`
}

let browser, page, worker

test.before(async t => {
  const address = await httpServer()
  console.log(`Server is running on port ${address}`)

  browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true })
  page = await browser.newPage()

  worker = new Promise(resolve => {
    browser.on('targetcreated', async target => {
      if (target.type() === 'service_worker') {
        resolve(target.worker())
      }
    })
  })

  await page.goto(address)
})

test.after(async t => {
  await browser.close()
})

/* global HTMLIFrameElement */
/* global Notification */
test('stealth: will pass Paul Irish', async t => {
  const detectionResults = await page.evaluate(detectHeadless)

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

test('stealth: inconsistencies between page and worker', async t => {
  const pageFP = await page.evaluate(detectFingerprint)
  const workerFP = await (await worker).evaluate(detectFingerprint)

  t.deepEqual(pageFP, workerFP)
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

  await test('navigator.webdriver not undefined', _ => {
    return navigator.webdriver !== undefined
  })

  /* eslint-disable no-proto */
  await test('navigator.webdriver property overridden', _ => {
    return (
      Object.getOwnPropertyDescriptor(navigator.__proto__, 'webdriver') !==
      undefined
    )
  })

  await test('navigator.webdriver prop detected', _ => {
    for (const prop in navigator) {
      if (prop === 'webdriver') {
        return true
      }
    }
    return false
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

/* global OffscreenCanvas */
function detectFingerprint() {
  const results = {}

  const props = [
    'userAgent',
    'language',
    'hardwareConcurrency',
    'deviceMemory',
    'languages',
    'platform'
  ]
  props.forEach(el => {
    results[el] = navigator[el].toString()
  })

  const canvasOffscreenWebgl = new OffscreenCanvas(256, 256)
  const contextWebgl = canvasOffscreenWebgl.getContext('webgl')
  const rendererInfo = contextWebgl.getExtension('WEBGL_debug_renderer_info')
  results.webglVendor = contextWebgl.getParameter(
    rendererInfo.UNMASKED_VENDOR_WEBGL
  )
  results.webglRenderer = contextWebgl.getParameter(
    rendererInfo.UNMASKED_RENDERER_WEBGL
  )

  results.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return results
}
