const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')

const Plugin = require('.')

/* global chrome */

test('stealth: will add functional chrome.csi function mock', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      runOnInsecureOrigins: true // for testing
    })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await page.evaluate(() => {
    const { timing } = window.performance
    const csi = window.chrome.csi()

    return {
      csi: {
        exists: window.chrome && 'csi' in window.chrome,
        toString: chrome.csi.toString()
      },
      dataOK: {
        onloadT: csi.onloadT === timing.domContentLoadedEventEnd,
        startE: csi.startE === timing.navigationStart,
        pageT: Number.isInteger(csi.pageT),
        tran: Number.isInteger(csi.tran)
      }
    }
  })

  t.deepEqual(results, {
    csi: {
      exists: true,
      toString: 'function () { [native code] }'
    },
    dataOK: {
      onloadT: true,
      pageT: true,
      startE: true,
      tran: true
    }
  })
})
