const test = require('ava')
const os = require('os')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const Plugin = require('.')

const fingerprintFn = page => page.evaluate('navigator.hardwareConcurrency')

test('vanilla: navigator.hardwareConcurrency matches real core count', async t => {
  const { pageFnResult } = await getVanillaFingerPrint(fingerprintFn)
  t.is(pageFnResult, os.cpus().length)
})

test('stealth: navigator.hardwareConcurrency is set to 4', async t => {
  const { pageFnResult } = await getStealthFingerPrint(Plugin, fingerprintFn)
  t.is(pageFnResult, 4)
})

test('stealth: navigator.hardwareConcurrency customized value', async t => {
  const { pageFnResult } = await getStealthFingerPrint(Plugin, fingerprintFn, {
    hardwareConcurrency: 8
  })
  t.is(pageFnResult, 8)
})
