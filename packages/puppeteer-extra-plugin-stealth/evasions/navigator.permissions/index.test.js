const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const Plugin = require('.')

test('vanilla: is prompt', async t => {
  const { permissions } = await getVanillaFingerPrint()
  t.is(permissions.state, 'prompt')
})

test('stealth: is denied', async t => {
  const { permissions } = await getStealthFingerPrint(Plugin)
  t.is(permissions.state, 'denied')
})
