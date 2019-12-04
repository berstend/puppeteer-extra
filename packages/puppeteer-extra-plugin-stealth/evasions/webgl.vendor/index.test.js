const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const Plugin = require('.')

test('vanilla: videoCard is Google Inc', async t => {
  const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
  const { videoCard } = await getVanillaFingerPrint(pageFn)
  t.deepEqual(videoCard, ['Google Inc.', 'Google SwiftShader'])
})

test('stealth: videoCard is Intel Inc', async t => {
  const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
  const { videoCard } = await getStealthFingerPrint(Plugin, pageFn)
  t.deepEqual(videoCard, ['Intel Inc.', 'Intel Iris OpenGL Engine'])
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

test('vanilla: webgl is native', async t => {
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

test('stealth: webgl is native', async t => {
  const pageFn = async page => await page.evaluate(extendedTests) // eslint-disable-line
  const { pageFnResult: result } = await getStealthFingerPrint(Plugin, pageFn)

  const wasHeadlessDetected = Object.values(result).some(e => e === false)
  if (wasHeadlessDetected) {
    console.log(result)
  }
  t.false(wasHeadlessDetected)
})
