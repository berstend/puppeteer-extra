const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const { vanillaPuppeteer, addExtra } = require('../../test/util')

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

test('vanilla: will not have modifications', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // https://datadome.co/bot-detection/client-side-detection-is-essential-for-bot-protection/
  const test1 = await page.evaluate(() => {
    const audioElt = document.createElement('audio')
    return audioElt.canPlayType.toString()
  })
  t.is(test1, 'function canPlayType() { [native code] }')

  const test2 = await page.evaluate(() => {
    const audioElt = document.createElement('audio')
    return audioElt.canPlayType.name
  })
  t.is(test2, 'canPlayType')
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

test('stealth: will not leak modifications', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // https://datadome.co/bot-detection/client-side-detection-is-essential-for-bot-protection/
  const test1 = await page.evaluate(() => {
    const audioElt = document.createElement('audio')
    return audioElt.canPlayType.toString()
  })
  t.is(test1, 'function canPlayType() { [native code] }')

  const test2 = await page.evaluate(() => {
    const audioElt = document.createElement('audio')
    return audioElt.canPlayType.name
  })
  t.is(test2, 'canPlayType')

  // Double check the plugin is active and spoofing e.g. the aac codec results
  const test3 = await page.evaluate(() => {
    const audioElt = document.createElement('audio')
    return audioElt.canPlayType('audio/aac')
  })
  t.is(test3, 'probably') // empty in Chromium without stealth plugin
})
