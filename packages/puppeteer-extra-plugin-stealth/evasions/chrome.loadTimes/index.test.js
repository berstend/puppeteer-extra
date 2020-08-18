const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')

const Plugin = require('.')

/* global chrome */

test('stealth: will add functional chrome.loadTimes function mock', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin({}))
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await page.evaluate(() => {
    const loadTimes = window.chrome.loadTimes()

    return {
      loadTimes: {
        exists: window.chrome && 'loadTimes' in window.chrome,
        toString: chrome.loadTimes.toString()
      },
      dataOK: {
        connectionInfo: 'connectionInfo' in loadTimes,
        npnNegotiatedProtocol: 'npnNegotiatedProtocol' in loadTimes,
        navigationType: 'navigationType' in loadTimes,
        wasAlternateProtocolAvailable:
          'wasAlternateProtocolAvailable' in loadTimes,
        wasFetchedViaSpdy: 'wasFetchedViaSpdy' in loadTimes,
        wasNpnNegotiated: 'wasNpnNegotiated' in loadTimes,

        firstPaintAfterLoadTime: 'firstPaintAfterLoadTime' in loadTimes,
        requestTime: 'requestTime' in loadTimes,
        startLoadTime: 'startLoadTime' in loadTimes,
        commitLoadTime: 'commitLoadTime' in loadTimes,
        finishDocumentLoadTime: 'finishDocumentLoadTime' in loadTimes,
        finishLoadTime: 'finishLoadTime' in loadTimes,
        firstPaintTime: 'firstPaintTime' in loadTimes
      }
    }
  })

  t.deepEqual(results, {
    loadTimes: {
      exists: true,
      toString: 'function () { [native code] }'
    },
    dataOK: {
      commitLoadTime: true,
      connectionInfo: true,
      finishDocumentLoadTime: true,
      finishLoadTime: true,
      firstPaintAfterLoadTime: true,
      firstPaintTime: true,
      navigationType: true,
      npnNegotiatedProtocol: true,
      requestTime: true,
      startLoadTime: true,
      wasAlternateProtocolAvailable: true,
      wasFetchedViaSpdy: true,
      wasNpnNegotiated: true
    }
  })
})
