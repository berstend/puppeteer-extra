const test = require('ava')

const fpscanner = require('fpscanner')

const { getVanillaFingerPrint, getStealthFingerPrint } = require('./util')
const Plugin = require('../.')

test('vanilla: will fail multiple fpscanner tests', async t => {
  const fingerPrint = await getVanillaFingerPrint()
  const testedFingerPrints = fpscanner.analyseFingerprint(fingerPrint)
  const failedChecks = Object.values(testedFingerPrints).filter(
    val => val.consistent < 3
  )
  t.is(failedChecks.length, 7)
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
