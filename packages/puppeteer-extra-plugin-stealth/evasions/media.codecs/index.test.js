const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const Plugin = require('.')

test('vanilla: doesnt support proprietary codecs', async t => {
  const { videoCodecs, audioCodecs } = await getVanillaFingerPrint()
  t.deepEqual(videoCodecs, { ogg: 'probably', h264: '', webm: 'probably' })
  t.deepEqual(audioCodecs, {
    ogg: 'probably',
    mp3: 'probably',
    wav: 'probably',
    m4a: '',
    aac: ''
  })
})

test('stealth: supports proprietary codecs', async t => {
  const { videoCodecs, audioCodecs } = await getStealthFingerPrint(Plugin)
  t.deepEqual(videoCodecs, {
    ogg: 'probably',
    h264: 'probably',
    webm: 'probably'
  })
  t.deepEqual(audioCodecs, {
    ogg: 'probably',
    mp3: 'probably',
    wav: 'probably',
    m4a: 'maybe',
    aac: 'probably'
  })
})
