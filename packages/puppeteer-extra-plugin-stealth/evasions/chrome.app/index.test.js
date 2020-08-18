const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')

const Plugin = require('.')

/* global chrome */

test('stealth: will add convincing chrome.app object', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin({}))
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await page.evaluate(() => {
    const catchErr = (fn, ...args) => {
      try {
        return fn.apply(this, args)
      } catch ({ name, message, stack }) {
        return { name, message, stack }
      }
    }

    return {
      app: {
        exists: window.chrome && 'app' in window.chrome,
        toString: chrome.app.toString(),
        deepToString: chrome.app.runningState.toString()
      },
      data: {
        getIsInstalled: chrome.app.getIsInstalled(),
        runningState: chrome.app.runningState(),
        getDetails: chrome.app.getDetails(),
        InstallState: chrome.app.InstallState,
        RunningState: chrome.app.RunningState
      },
      errors: {
        getIsInstalled: catchErr(chrome.app.getDetails, 'foo').message,
        stackOK: !catchErr(chrome.app.getDetails, 'foo').stack.includes(
          'at getDetails'
        )
      }
    }
  })

  t.deepEqual(results, {
    app: {
      exists: true,
      toString: '[object Object]',
      deepToString: 'function getDetails() { [native code] }'
    },
    data: {
      InstallState: {
        DISABLED: 'disabled',
        INSTALLED: 'installed',
        NOT_INSTALLED: 'not_installed'
      },
      RunningState: {
        CANNOT_RUN: 'cannot_run',
        READY_TO_RUN: 'ready_to_run',
        RUNNING: 'running'
      },
      getDetails: null,
      getIsInstalled: false,
      runningState: 'cannot_run'
    },
    errors: {
      getIsInstalled: 'Error in invocation of app.getDetails()',
      stackOK: true
    }
  })
})
