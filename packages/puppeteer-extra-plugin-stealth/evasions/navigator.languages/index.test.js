const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const Plugin = require('.')

// TODO: Vanilla seems fine, evasion obsolete?
test('vanilla: is array with en-US', async t => {
  const { languages } = await getVanillaFingerPrint()
  t.is(Array.isArray(languages), true)
  t.is(languages[0], 'en-US')
})

test('stealth: is array with en-US', async t => {
  const { languages } = await getStealthFingerPrint(Plugin)
  t.is(Array.isArray(languages), true)
  t.is(languages[0], 'en-US')
})
