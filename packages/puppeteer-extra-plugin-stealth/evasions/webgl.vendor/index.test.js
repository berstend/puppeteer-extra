const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const { vanillaPuppeteer, addExtra } = require('../../test/util')

const { default: Plugin } = require('.')

test.serial('vanilla: videoCard is Google Inc', async t => {
  const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
  const { videoCard } = await getVanillaFingerPrint(pageFn)
  t.truthy(videoCard.length === 2, 'videoCard should be an array of 2 elements')

  t.regex(videoCard[0], /Google/, 'should be an Google Inc. card')
  if (videoCard[1].includes('Vulkan')) {
    // pptr 13
    // 'ANGLE (Google, Vulkan 1.2.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
    // pptr 14
    // 'ANGLE (Google, Vulkan 1.2.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver-5.0.0)',
    t.regex(videoCard[1], /Vulkan/, 'should be a Vulkan')
  } else {
    // old pptr
    t.deepEqual(videoCard, ['Google Inc.', 'Google SwiftShader'])
  }
})

test.serial('stealth: videoCard is Intel Inc', async t => {
  const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
  const { videoCard } = await getStealthFingerPrint(Plugin, pageFn)
  t.deepEqual(videoCard, ['Intel Inc.', 'Intel Iris OpenGL Engine'])
})

test.serial('stealth: customized values', async t => {
  const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
  const { videoCard } = await getStealthFingerPrint(Plugin, pageFn, {
    vendor: 'foo',
    renderer: 'bar'
  })
  t.deepEqual(videoCard, ['foo', 'bar'])
})

/* global WebGLRenderingContext */
async function extendedTests() {
  const results = {}

  async function test(name, fn) {
    const detectionPassed = await fn()
    if (detectionPassed) console.log(`Chrome headless detected via ${name}`)
    results[name] = detectionPassed
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgl')

  await test('descriptorsOK', _ => {
    const descriptors = Object.getOwnPropertyDescriptors(
      WebGLRenderingContext.prototype
    )
    const str = descriptors.getParameter.toString()
    return str === `[object Object]`
  })

  await test('toStringOK', _ => {
    const str = context.getParameter.toString()
    return str === `function getParameter() { [native code] }`
  })

  await test('toStringOK2', _ => {
    const str = WebGLRenderingContext.prototype.getParameter.toString()
    return str === `function getParameter() { [native code] }`
  })

  // Make sure we not reveal our proxy through errors
  await test('errorOK', _ => {
    try {
      return context.getParameter()
    } catch (err) {
      return !err.stack.includes(`at Object.apply`)
    }
  })

  // Should not throw (that was old stealth behavior)
  await test('elementOK', _ => {
    try {
      return context.getParameter(123) === null
    } catch (_) {
      return false
    }
  })

  return results
}

test.serial('vanilla: webgl is native', async t => {
  const pageFn = async page => {
    // page.on('console', msg => {
    //   console.log('Page console: ', msg.text())
    // })
    return await page.evaluate(extendedTests) // eslint-disable-line
  }
  const { pageFnResult: result } = await getVanillaFingerPrint(pageFn)

  const wasHeadlessDetected = Object.values(result).some(e => e === false)
  if (wasHeadlessDetected) {
    console.log(result)
  }
  t.false(wasHeadlessDetected)
})

test.serial('stealth: webgl is native', async t => {
  const pageFn = async page => await page.evaluate(extendedTests) // eslint-disable-line
  const { pageFnResult: result } = await getStealthFingerPrint(Plugin, pageFn)

  const wasHeadlessDetected = Object.values(result).some(e => e === false)
  if (wasHeadlessDetected) {
    console.log(result)
  }
  t.false(wasHeadlessDetected)
})

/**
 * A very simple method to retrieve the name of the default videocard of the system
 * using webgl.
 *
 * Example (Apple Retina MBP 13): {vendor: "Intel Inc.", renderer: "Intel(R) Iris(TM) Graphics 6100"}
 *
 * @see https://stackoverflow.com/questions/49267764/how-to-get-the-video-card-driver-name-using-javascript-browser-side
 * @returns {Object}
 */
function getVideoCardInfo(context = 'webgl') {
  const gl = document.createElement('canvas').getContext(context)
  if (!gl) {
    return {
      error: 'no webgl'
    }
  }
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (debugInfo) {
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    }
  }
  return {
    error: 'no WEBGL_debug_renderer_info'
  }
}

test.serial('stealth: handles WebGLRenderingContext', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const videoCardInfo = await page.evaluate(getVideoCardInfo, 'webgl')
  t.is(videoCardInfo.error, undefined)
  t.is(videoCardInfo.vendor, 'Intel Inc.')
  t.is(videoCardInfo.renderer, 'Intel Iris OpenGL Engine')
})

test.serial('stealth: handles WebGL2RenderingContext', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const videoCardInfo = await page.evaluate(getVideoCardInfo, 'webgl2')
  t.is(videoCardInfo.error, undefined)
  t.is(videoCardInfo.vendor, 'Intel Inc.')
  t.is(videoCardInfo.renderer, 'Intel Iris OpenGL Engine')
})

test.serial('vanilla: normal toString stuff', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await page.evaluate(() => {
    return WebGLRenderingContext.prototype.getParameter.toString + ''
  })
  t.is(test1, 'function toString() { [native code] }')

  const test2 = await page.evaluate(() => {
    return WebGLRenderingContext.prototype.getParameter.toString()
  })
  t.is(test2, 'function getParameter() { [native code] }')
})

test.serial('stealth: will not leak toString stuff', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await page.evaluate(() => {
    return WebGLRenderingContext.prototype.getParameter.toString + ''
  })
  t.is(test1, 'function toString() { [native code] }') // returns function () { [native code] }

  const test2 = await page.evaluate(() => {
    return WebGLRenderingContext.prototype.getParameter.toString()
  })
  t.is(test2, 'function getParameter() { [native code] }')
})

test.serial('stealth: sets user opts correctly', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ vendor: 'alice', renderer: 'bob' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const videoCardInfo = await page.evaluate(getVideoCardInfo, 'webgl')
  t.is(videoCardInfo.error, undefined)
  t.is(videoCardInfo.vendor, 'alice')
  t.is(videoCardInfo.renderer, 'bob')
})

test.serial('stealth: does not affect protoype', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ vendor: 'alice', renderer: 'bob' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const result = await page.evaluate(() => {
    try {
      return WebGLRenderingContext.prototype.getParameter(37445)
    } catch (err) {
      return err.message
    }
  })
  t.is(result, 'Illegal invocation')
})
