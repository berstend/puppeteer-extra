const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint,
  dummyHTMLPath,
  vanillaPuppeteer,
  addExtra
} = require('../../test/util')
// const Plugin = require('.')
// NOTE: We're using the full plugin for testing here as `iframe.contentWindow` uses data set by `chrome.runtime`
const Plugin = require('puppeteer-extra-plugin-stealth')

// Fix CI issues with old versions
const isOldPuppeteerVersion = () => {
  const version = process.env.PUPPETEER_VERSION
  const isOld = version && (version === '1.9.0' || version === '1.6.2')
  return isOld
}

test('vanilla: will be undefined', async t => {
  const { iframeChrome } = await getVanillaFingerPrint()
  t.is(iframeChrome, 'undefined')
})

test('stealth: will be object', async t => {
  const { iframeChrome } = await getStealthFingerPrint(Plugin)
  t.is(iframeChrome, 'object')
})

test('stealth: will not break iframes', async t => {
  const browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true })
  const page = await browser.newPage()

  const testFuncReturnValue = 'TESTSTRING'
  await page.evaluate(returnValue => {
    const { document } = window // eslint-disable-line
    const body = document.querySelector('body')
    const iframe = document.createElement('iframe')
    iframe.srcdoc = 'foobar'
    iframe.contentWindow.mySuperFunction = () => returnValue
    body.appendChild(iframe)
  }, testFuncReturnValue)
  const realReturn = await page.evaluate(
    () => document.querySelector('iframe').contentWindow.mySuperFunction() // eslint-disable-line
  )
  await browser.close()

  t.is(realReturn, 'TESTSTRING')
})

test('vanilla: will not have contentWindow[0]', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const zero = await page.evaluate(returnValue => {
    const { document } = window // eslint-disable-line
    const body = document.querySelector('body')
    const iframe = document.createElement('iframe')
    iframe.srcdoc = 'foobar'
    body.appendChild(iframe)
    return typeof iframe.contentWindow[0]
  })
  await browser.close()

  t.is(zero, 'undefined')
})

test('stealth: will not have contentWindow[0]', async t => {
  const browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true })
  const page = await browser.newPage()

  const zero = await page.evaluate(returnValue => {
    const { document } = window // eslint-disable-line
    const body = document.querySelector('body')
    const iframe = document.createElement('iframe')
    iframe.srcdoc = 'foobar'
    body.appendChild(iframe)
    return typeof iframe.contentWindow[0]
  })
  await browser.close()

  t.is(zero, 'undefined')
})

test('vanilla: will not have chrome runtine in any frame', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('file://' + dummyHTMLPath)

  const basiciframe = await page.evaluate(() => {
    const el = document.createElement('iframe')
    document.body.appendChild(el)
    return el.contentWindow.chrome
  })

  const sandboxSOiframe = await page.evaluate(() => {
    const el = document.createElement('iframe')
    el.setAttribute('sandbox', 'allow-same-origin')
    document.body.appendChild(el)
    return el.contentWindow.chrome
  })

  const sandboxSOASiframe = await page.evaluate(() => {
    const el = document.createElement('iframe')
    el.setAttribute('sandbox', 'allow-same-origin allow-scripts')
    document.body.appendChild(el)
    return el.contentWindow.chrome
  })

  const srcdociframe = await page.evaluate(() => {
    const el = document.createElement('iframe')
    el.srcdoc = 'blank page, boys.'
    document.body.appendChild(el)
    return el.contentWindow.chrome
  })

  // console.log('basic iframe', basiciframe)
  // console.log('sandbox same-origin iframe', sandboxSOiframe)
  // console.log('sandbox same-origin&scripts iframe', sandboxSOASiframe)
  // console.log('srcdoc iframe', srcdociframe)

  await browser.close()

  t.is(typeof basiciframe, 'undefined')
  t.is(typeof sandboxSOiframe, 'undefined')
  t.is(typeof sandboxSOASiframe, 'undefined')
  t.is(typeof srcdociframe, 'undefined')
})

test('vanilla: will return empty srcdoc by default', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const srcdoc = await page.evaluate(returnValue => {
    const { document } = window // eslint-disable-line
    const iframe = document.createElement('iframe')
    return iframe.srcdoc
  })
  await browser.close()

  t.is(srcdoc, '')
})

test('stealth: will return empty srcdoc by default', async t => {
  const browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true })
  const page = await browser.newPage()

  const srcdoc = await page.evaluate(returnValue => {
    const { document } = window // eslint-disable-line
    const iframe = document.createElement('iframe')
    return iframe.srcdoc
  })
  await browser.close()

  t.is(srcdoc, '')
})

test('stealth: it will cover all frames including srcdoc', async t => {
  // const browser = await vanillaPuppeteer.launch({ headless: false })
  const browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('file://' + dummyHTMLPath)

  const basiciframe = await page.evaluate(() => {
    const el = document.createElement('iframe')
    document.body.appendChild(el)
    return el.contentWindow.chrome
  })

  const sandboxSOiframe = await page.evaluate(() => {
    const el = document.createElement('iframe')
    el.setAttribute('sandbox', 'allow-same-origin')
    document.body.appendChild(el)
    return el.contentWindow.chrome
  })

  const sandboxSOASiframe = await page.evaluate(() => {
    const el = document.createElement('iframe')
    el.setAttribute('sandbox', 'allow-same-origin allow-scripts')
    document.body.appendChild(el)
    return el.contentWindow.chrome
  })

  const srcdociframe = await page.evaluate(() => {
    const el = document.createElement('iframe')
    el.srcdoc = 'blank page, boys.'
    document.body.appendChild(el)
    return el.contentWindow.chrome
  })

  // console.log('basic iframe', basiciframe)
  // console.log('sandbox same-origin iframe', sandboxSOiframe)
  // console.log('sandbox same-origin&scripts iframe', sandboxSOASiframe)
  // console.log('srcdoc iframe', srcdociframe)

  await browser.close()

  if (isOldPuppeteerVersion()) {
    t.is(typeof basiciframe, 'object')
  } else {
    t.is(typeof basiciframe, 'object')
    t.is(typeof sandboxSOiframe, 'object')
    t.is(typeof sandboxSOASiframe, 'object')
    t.is(typeof srcdociframe, 'object')
  }
})

/* global HTMLIFrameElement */
test('stealth: it will emulate advanved contentWindow features correctly', async t => {
  // const browser = await vanillaPuppeteer.launch({ headless: false })
  const browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('file://' + dummyHTMLPath)

  // page.on('console', msg => {
  //   console.log('Page console: ', msg.text())
  // })

  const results = await page.evaluate(() => {
    const results = {}

    const iframe = document.createElement('iframe')
    iframe.srcdoc = 'page intentionally left blank' // Note: srcdoc
    document.body.appendChild(iframe)

    const basicIframe = document.createElement('iframe')
    basicIframe.src = 'data:text/plain;charset=utf-8,foobar'
    document.body.appendChild(iframe)

    results.descriptorsOK = (() => {
      // Verify iframe prototype isn't touched
      const descriptors = Object.getOwnPropertyDescriptors(
        HTMLIFrameElement.prototype
      )
      const str = descriptors.contentWindow.get.toString()
      return str === `function get contentWindow() { [native code] }`
    })()

    results.noProxySignature = (() => {
      return iframe.srcdoc.toString.hasOwnProperty('[[IsRevoked]]') // eslint-disable-line
    })()

    results.doesExist = (() => {
      // Verify iframe isn't remapped to main window
      return !!iframe.contentWindow
    })()

    results.isNotAClone = (() => {
      // Verify iframe isn't remapped to main window
      return iframe.contentWindow !== window
    })()

    results.hasPlugins = (() => {
      return iframe.contentWindow.navigator.plugins.length > 0
    })()

    results.hasSameNumberOfPlugins = (() => {
      return (
        window.navigator.plugins.length ===
        iframe.contentWindow.navigator.plugins.length
      )
    })()

    results.SelfIsNotWindow = (() => {
      return iframe.contentWindow.self !== window
    })()

    results.SelfIsNotWindowTop = (() => {
      return iframe.contentWindow.self !== window.top
    })()

    results.TopIsNotSame = (() => {
      return iframe.contentWindow.top !== iframe.contentWindow
    })()

    results.FrameElementMatches = (() => {
      return iframe.contentWindow.frameElement === iframe
    })()

    results.StackTraces = (() => {
      try {
        // eslint-disable-next-line
        document['createElement'](0)
      } catch (e) {
        return e.stack
      }
      return false
    })()

    return results
  })

  await browser.close()

  if (isOldPuppeteerVersion()) {
    t.true(true)
    return
  }

  t.true(results.descriptorsOK)
  t.true(results.doesExist)
  t.true(results.isNotAClone)
  t.true(results.hasPlugins)
  t.true(results.hasSameNumberOfPlugins)
  t.true(results.SelfIsNotWindow)
  t.true(results.SelfIsNotWindowTop)
  t.true(results.TopIsNotSame)
  t.false(results.StackTraces.includes(`at Object.apply`))
})

// NOTE: This test is flaky in CI and temporarily disabled
// test('regression: new method will not break recaptcha popup', async t => {
//   // const browser = await vanillaPuppeteer.launch({ headless: false })
//   const browser = await addExtra(vanillaPuppeteer)
//     .use(Plugin())
//     .launch({ headless: true })
//   const page = await browser.newPage()

//   page.waitForTimeout = page.waitForTimeout || page.waitFor

//   await page.goto('https://www.fbdemo.com/invisible-captcha/index.html')

//   await page.type('#tswname', 'foo')
//   await page.type('#tswemail', 'foo@foo.foo')
//   await page.type(
//     '#tswcomments',
//     'In the depth of winter, I finally learned that within me there lay an invincible summer.'
//   )
//   await page.click('#tswsubmit')
//   await page.waitForTimeout(1000)

//   const { hasRecaptchaPopup } = await page.evaluate(() => {
//     const hasRecaptchaPopup = !!document.querySelectorAll(
//       `iframe[title="recaptcha challenge"]`
//     ).length
//     return { hasRecaptchaPopup }
//   })

//   await browser.close()

//   t.true(hasRecaptchaPopup)
// })

// test('regression: old method indeed did break recaptcha popup', async t => {
//   const browser = await vanillaPuppeteer.launch({ headless: true })
//   const page = await browser.newPage()

//   page.waitForTimeout = page.waitForTimeout || page.waitFor
//   // Old method
//   await page.evaluateOnNewDocument(() => {
//     // eslint-disable-next-line
//     Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
//       get: function() {
//         return window
//       }
//     })
//   })

//   await page.goto('https://www.fbdemo.com/invisible-captcha/index.html')

//   await page.type('#tswname', 'foo')
//   await page.type('#tswemail', 'foo@foo.foo')
//   await page.type(
//     '#tswcomments',
//     'In the depth of winter, I finally learned that within me there lay an invincible summer.'
//   )
//   await page.click('#tswsubmit')
//   await page.waitForTimeout(1000)

//   const { hasRecaptchaPopup } = await page.evaluate(() => {
//     const hasRecaptchaPopup = !!document.querySelectorAll(
//       `iframe[title="recaptcha challenge"]`
//     ).length
//     return { hasRecaptchaPopup }
//   })

//   await browser.close()

//   t.false(hasRecaptchaPopup)
// })
