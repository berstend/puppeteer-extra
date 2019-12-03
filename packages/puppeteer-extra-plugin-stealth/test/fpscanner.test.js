const test = require('ava')

const fpscanner = require('fpscanner')

const { getVanillaFingerPrint, getStealthFingerPrint } = require('./util')
const Plugin = require('../.')

// Fix CI issues with old versions
const isOldPuppeteerVersion = () => {
  const version = process.env.PUPPETEER_VERSION
  if (!version) {
    return false
  }
  if (version === '1.9.0' || version === '1.6.2') {
    return true
  }
  return false
}

test('vanilla: will fail multiple fpscanner tests', async t => {
  const fingerPrint = await getVanillaFingerPrint()
  const testedFingerPrints = fpscanner.analyseFingerprint(fingerPrint)
  const failedChecks = Object.values(testedFingerPrints).filter(
    val => val.consistent < 3
  )

  if (isOldPuppeteerVersion()) {
    t.is(failedChecks.length, 8)
  } else {
    t.is(failedChecks.length, 7)
  }
})

test('stealth: will not fail a single fpscanner test', async t => {
  const fingerPrint = await getStealthFingerPrint(Plugin)
  const testedFingerPrints = fpscanner.analyseFingerprint(fingerPrint)
  const failedChecks = Object.values(testedFingerPrints).filter(
    val => val.consistent < 3
  )

  if (failedChecks.length) {
    console.warn('The following fingerprints failed:', failedChecks)
  }
  t.is(failedChecks.length, 0)
})
