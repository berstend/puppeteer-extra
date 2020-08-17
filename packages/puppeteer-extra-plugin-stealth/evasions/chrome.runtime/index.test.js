const test = require('ava')

// const {
//   getVanillaFingerPrint,
//   getStealthFingerPrint
// } = require('../../test/util')
const { vanillaPuppeteer, addExtra } = require('../../test/util')

const Plugin = require('.')

const STATIC_DATA = require('./staticData.json')

/* global chrome */

// test('vanilla: is chrome false', async t => {
//   const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
//   const { pageFnResult: chrome, hasChrome } = await getVanillaFingerPrint(
//     pageFn
//   )
//   t.is(hasChrome, false)
//   t.false(chrome instanceof Object)
//   t.is(chrome, undefined)
// })

// test('stealth: is chrome true', async t => {
//   const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
//   const { pageFnResult: chrome, hasChrome } = await getStealthFingerPrint(
//     Plugin,
//     pageFn
//   )
//   t.is(hasChrome, true)
//   t.true(chrome instanceof Object)
// })

test('stealth: will add convincing chrome.runtime object', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      runOnInsecureOrigins: true // for testing
    })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  //

  const results = await page.evaluate(() => {
    const catchErr = (fn, ...args) => {
      try {
        return fn.apply(this, args)
      } catch (err) {
        return err.toString()
      }
    }

    return {
      runtime: {
        exists: window.chrome && 'runtime' in window.chrome,
        toString: chrome.runtime.toString()
      },
      staticData: {
        OnInstalledReason: chrome.runtime.OnInstalledReason,
        OnRestartRequiredReason: chrome.runtime.OnRestartRequiredReason,
        PlatformArch: chrome.runtime.PlatformArch,
        PlatformNaclArch: chrome.runtime.PlatformNaclArch,
        PlatformOs: chrome.runtime.PlatformOs,
        RequestUpdateCheckStatus: chrome.runtime.RequestUpdateCheckStatus
      },
      id: {
        exists: 'id' in chrome.runtime,
        undefined: chrome.runtime.id === undefined
      },
      sendMessage: {
        exists: 'sendMessage' in chrome.runtime,
        name: chrome.runtime.sendMessage.name,
        toString1: chrome.runtime.sendMessage + '',
        toString2: chrome.runtime.sendMessage.toString(),
        validIdWorks:
          chrome.runtime.sendMessage('nckgahadagoaajjgafhacjanaoiihapd', '') ===
          undefined
      },
      sendMessageErrors: {
        noArg: catchErr(chrome.runtime.sendMessage),
        singleArg: catchErr(chrome.runtime.sendMessage, ''),
        tooManyArg: catchErr(
          chrome.runtime.sendMessage,
          '',
          '',
          '',
          '',
          '',
          ''
        ),
        incorrectArg: catchErr(chrome.runtime.sendMessage, '', '', {}, ''),
        noValidID: catchErr(chrome.runtime.sendMessage, 'foo', '')
      }
    }
  })

  const bla = `TypeError: Error in invocation of runtime.sendMessage(optional string extensionId, any message, optional object options, optional function responseCallback)`
  t.deepEqual(results, {
    runtime: {
      exists: true,
      toString: '[object Object]'
    },
    staticData: STATIC_DATA,
    id: {
      exists: true,
      undefined: true
    },
    sendMessage: {
      exists: true,
      name: 'sendMessage',
      toString1: 'function sendMessage() { [native code] }',
      toString2: 'function sendMessage() { [native code] }',
      validIdWorks: true
    },
    sendMessageErrors: {
      noArg: `${bla}: No matching signature.`,
      singleArg: `${bla}: chrome.runtime.sendMessage() called from a webpage must specify an Extension ID (string) for its first argument.`,
      tooManyArg: `${bla}: No matching signature.`,
      incorrectArg: `${bla}: No matching signature.`,
      noValidID: `${bla}: Invalid extension id: 'foo'`
    }
  })
})
