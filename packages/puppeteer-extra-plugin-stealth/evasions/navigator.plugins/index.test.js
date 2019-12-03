const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const Plugin = require('.')

test('vanilla: empty plugins, empty mimetypes', async t => {
  const { plugins, mimeTypes } = await getVanillaFingerPrint()
  t.is(plugins.length, 0)
  t.is(mimeTypes.length, 0)
})

test('stealth: has plugin, has mimetypes', async t => {
  const { plugins, mimeTypes } = await getStealthFingerPrint(Plugin)
  t.is(plugins.length, 3)
  t.is(mimeTypes.length, 4)
})
