const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const Plugin = require('.')

test('vanilla: is chrome false', async t => {
  const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
  const { pageFnResult: chrome, hasChrome } = await getVanillaFingerPrint(
    pageFn
  )
  t.is(hasChrome, false)
  t.false(chrome instanceof Object)
  t.is(chrome, undefined)
})

test('stealth: is chrome true', async t => {
  const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
  const { pageFnResult: chrome, hasChrome } = await getStealthFingerPrint(
    Plugin,
    pageFn
  )
  t.is(hasChrome, true)
  t.true(chrome instanceof Object)
})
