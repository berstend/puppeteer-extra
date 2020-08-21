const test = require('ava')

const { vanillaPuppeteer } = require('../../test/util')

const utils = require('.')
const withUtils = require('./withUtils')

/* global HTMLMediaElement WebGLRenderingContext */

test('splitObjPath: will do what it says', async t => {
  const { objName, propName } = utils.splitObjPath(
    'HTMLMediaElement.prototype.canPlayType'
  )
  t.is(objName, 'HTMLMediaElement.prototype')
  t.is(propName, 'canPlayType')
})

test('makeNativeString: will do what it says', async t => {
  t.is(utils.makeNativeString('bob'), 'function bob() { [native code] }')
  t.is(
    utils.makeNativeString('toString'),
    'function toString() { [native code] }'
  )
  t.is(utils.makeNativeString(), 'function () { [native code] }')
})

test('replaceWithProxy: will work correctly', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await withUtils(page).evaluate(utils => {
    const dummyProxyHandler = {
      get(target, param) {
        if (param && param === 'ping') {
          return 'pong'
        }
        return utils.cache.Reflect.get(...(arguments || []))
      },
      apply() {
        return utils.cache.Reflect.apply(...arguments)
      }
    }
    utils.replaceWithProxy(
      HTMLMediaElement.prototype,
      'canPlayType',
      dummyProxyHandler
    )
    return {
      toString: HTMLMediaElement.prototype.canPlayType.toString(),
      ping: HTMLMediaElement.prototype.canPlayType.ping
    }
  })
  t.deepEqual(test1, {
    toString: 'function canPlayType() { [native code] }',
    ping: 'pong'
  })
})

test('replaceObjPathWithProxy: will work correctly', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await withUtils(page).evaluate(utils => {
    const dummyProxyHandler = {
      get(target, param) {
        if (param && param === 'ping') {
          return 'pong'
        }
        return utils.cache.Reflect.get(...(arguments || []))
      },
      apply() {
        return utils.cache.Reflect.apply(...arguments)
      }
    }
    utils.replaceObjPathWithProxy(
      'HTMLMediaElement.prototype.canPlayType',
      dummyProxyHandler
    )
    return {
      toString: HTMLMediaElement.prototype.canPlayType.toString(),
      ping: HTMLMediaElement.prototype.canPlayType.ping
    }
  })
  t.deepEqual(test1, {
    toString: 'function canPlayType() { [native code] }',
    ping: 'pong'
  })
})

test('redirectToString: is battle hardened', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // Patch all documents including iframes
  await withUtils(page).evaluateOnNewDocument(utils => {
    // We redirect toString calls targeted at `canPlayType` to `getParameter`,
    // so if everything works correctly we expect `getParameter` as response.
    const proxyObj = HTMLMediaElement.prototype.canPlayType
    const originalObj = WebGLRenderingContext.prototype.getParameter

    utils.redirectToString(proxyObj, originalObj)
  })
  await page.goto('about:blank')

  const result = await withUtils(page).evaluate(utils => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    return {
      target: {
        raw: HTMLMediaElement.prototype.canPlayType + '',
        rawiframe:
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType + '',
        raw2: HTMLMediaElement.prototype.canPlayType.toString(),
        rawiframe2: iframe.contentWindow.HTMLMediaElement.prototype.canPlayType.toString(),
        direct: Function.prototype.toString.call(
          HTMLMediaElement.prototype.canPlayType
        ),
        directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
          HTMLMediaElement.prototype.canPlayType
        ),
        iframeWithdirect: Function.prototype.toString.call(
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
        ),
        iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
        )
      },
      toString: {
        obj: HTMLMediaElement.prototype.canPlayType.toString + '',
        objiframe:
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType.toString +
          '',
        raw: Function.prototype.toString + '',
        rawiframe: iframe.contentWindow.Function.prototype.toString + '',
        direct: Function.prototype.toString.call(Function.prototype.toString),
        directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
          Function.prototype.toString
        ),
        iframeWithdirect: Function.prototype.toString.call(
          iframe.contentWindow.Function.prototype.toString
        ),
        iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
          iframe.contentWindow.Function.prototype.toString
        )
      }
    }
  })
  t.deepEqual(result, {
    target: {
      raw: 'function getParameter() { [native code] }',
      raw2: 'function getParameter() { [native code] }',
      rawiframe: 'function getParameter() { [native code] }',
      rawiframe2: 'function getParameter() { [native code] }',
      direct: 'function getParameter() { [native code] }',
      directWithiframe: 'function getParameter() { [native code] }',
      iframeWithdirect: 'function getParameter() { [native code] }',
      iframeWithiframe: 'function getParameter() { [native code] }'
    },
    toString: {
      obj: 'function toString() { [native code] }',
      objiframe: 'function toString() { [native code] }',
      raw: 'function toString() { [native code] }',
      rawiframe: 'function toString() { [native code] }',
      direct: 'function toString() { [native code] }',
      directWithiframe: 'function toString() { [native code] }',
      iframeWithdirect: 'function toString() { [native code] }',
      iframeWithiframe: 'function toString() { [native code] }'
    }
  })
})

test('patchToString: will work correctly', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // Test verbatim string replacement
  const test1 = await withUtils(page).evaluate(utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType, 'bob')
    return HTMLMediaElement.prototype.canPlayType.toString()
  })
  t.is(test1, 'bob')

  // Test automatic mode derived from `.name`
  const test2 = await withUtils(page).evaluate(utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType)
    return HTMLMediaElement.prototype.canPlayType.toString()
  })
  t.is(test2, 'function canPlayType() { [native code] }')

  // Make sure automatic mode derived from `.name` works with proxies
  const test3 = await withUtils(page).evaluate(utils => {
    HTMLMediaElement.prototype.canPlayType = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      {}
    )
    utils.patchToString(HTMLMediaElement.prototype.canPlayType)
    return HTMLMediaElement.prototype.canPlayType.toString()
  })
  t.is(test3, 'function canPlayType() { [native code] }')

  // Actually verify there's an issue when using vanilla Proxies
  const test4 = await withUtils(page).evaluate(utils => {
    HTMLMediaElement.prototype.canPlayType = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      {}
    )
    return HTMLMediaElement.prototype.canPlayType.toString()
  })
  t.is(test4, 'function () { [native code] }')
})

function toStringTest(obj) {
  obj = eval(obj) // eslint-disable-line no-eval
  return `
- obj.toString(): ${obj.toString()}
- obj.name: ${obj.name}
- obj.toString + "": ${obj.toString + ''}
- obj.toString.name: ${obj.toString.name}
- obj.valueOf + "": ${obj.valueOf + ''}
- obj.valueOf().name: ${obj.valueOf().name}
- Object.prototype.toString.apply(obj): ${Object.prototype.toString.apply(obj)}
- Function.prototype.toString.call(obj): ${Function.prototype.toString.call(
    obj
  )}
- Function.prototype.valueOf.call(obj) + "": ${Function.prototype.valueOf.call(
    obj
  ) + ''}
- obj.toString === Function.prototype.toString: ${obj.toString ===
    Function.prototype.toString}
`.trim()
}

test('patchToString: passes all toString tests', async t => {
  const toStringVanilla = await (async function() {
    const browser = await vanillaPuppeteer.launch({ headless: true })
    const page = await browser.newPage()
    return page.evaluate(toStringTest, 'HTMLMediaElement.prototype.canPlayType')
  })()
  const toStringStealth = await (async function() {
    const browser = await vanillaPuppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await withUtils(page).evaluate(utils => {
      HTMLMediaElement.prototype.canPlayType = function canPlayType() {}
      utils.patchToString(HTMLMediaElement.prototype.canPlayType)
    })
    return page.evaluate(toStringTest, 'HTMLMediaElement.prototype.canPlayType')
  })()

  // Check that the unmodified results are as expected
  t.is(
    toStringVanilla,
    `
- obj.toString(): function canPlayType() { [native code] }
- obj.name: canPlayType
- obj.toString + "": function toString() { [native code] }
- obj.toString.name: toString
- obj.valueOf + "": function valueOf() { [native code] }
- obj.valueOf().name: canPlayType
- Object.prototype.toString.apply(obj): [object Function]
- Function.prototype.toString.call(obj): function canPlayType() { [native code] }
- Function.prototype.valueOf.call(obj) + "": function canPlayType() { [native code] }
- obj.toString === Function.prototype.toString: true
`.trim()
  )

  // Make sure our customizations leave no trace
  t.is(toStringVanilla, toStringStealth)
})

test('patchToString: vanilla has iframe issues', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // Only patch the main window
  const result = await withUtils(page).evaluate(utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType, 'bob')

    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    return {
      direct: Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithdirect: Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      )
    }
  })
  t.deepEqual(result, {
    direct: 'bob',
    directWithiframe: 'function canPlayType() { [native code] }',
    iframeWithdirect: 'function canPlayType() { [native code] }',
    iframeWithiframe: 'function canPlayType() { [native code] }'
  })
})

test('patchToString: stealth has no iframe issues', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // Patch all documents including iframes
  await withUtils(page).evaluateOnNewDocument(utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType, 'alice')
  })
  await page.goto('about:blank')

  const result = await withUtils(page).evaluate(utils => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    return {
      direct: Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithdirect: Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      )
    }
  })
  t.deepEqual(result, {
    direct: 'alice',
    directWithiframe: 'alice',
    iframeWithdirect: 'alice',
    iframeWithiframe: 'alice'
  })
})

test('stripProxyFromErrors: will work correctly', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await withUtils(page).evaluate(utils => {
    const getStack = prop => {
      try {
        prop.caller() // Will throw (HTMLMediaElement.prototype.canPlayType.caller)
        return false
      } catch (err) {
        return err.stack
      }
    }
    /** We need traps to show up in the error stack */
    const dummyProxyHandler = {
      get() {
        return utils.cache.Reflect.get(...(arguments || []))
      },
      apply() {
        return utils.cache.Reflect.apply(...arguments)
      }
    }
    const vanillaProxy = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      dummyProxyHandler
    )
    const stealthProxy = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      utils.stripProxyFromErrors(dummyProxyHandler)
    )

    const stacks = {
      vanilla: getStack(HTMLMediaElement.prototype.canPlayType),
      vanillaProxy: getStack(vanillaProxy),
      stealthProxy: getStack(stealthProxy)
    }
    return stacks
  })

  // Check that the untouched stuff behaves as expected
  t.true(results.vanilla.includes(`TypeError: 'caller'`))
  t.false(results.vanilla.includes(`at Object.get`))

  // Regression test: Make sure vanilla JS Proxies leak the stack trace
  t.true(results.vanillaProxy.includes(`TypeError: 'caller'`))
  t.true(results.vanillaProxy.includes(`at Object.get`))

  // Stealth tests
  t.true(results.stealthProxy.includes(`TypeError: 'caller'`))
  t.false(results.stealthProxy.includes(`at Object.get`))
})

test('replaceProperty: will work without traces', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await withUtils(page).evaluate(utils => {
    utils.replaceProperty(Object.getPrototypeOf(navigator), 'languages', {
      get: () => ['de-DE']
    })
    return {
      propNamesLength: Object.getOwnPropertyNames(navigator).length
    }
  })
  t.is(results.propNamesLength, 0)
})

test('cache: will prevent leaks through overriding methods', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await withUtils(page).evaluate(utils => {
    const sniffResults = {
      vanilla: false,
      stealth: false
    }

    const vanillaProxy = new Proxy(
      {},
      {
        get() {
          return Reflect.get(...arguments)
        }
      }
    )
    Reflect.get = () => (sniffResults.vanilla = true)
    // trigger get trap
    vanillaProxy.foo // eslint-disable-line

    const stealthProxy = new Proxy(
      {},
      {
        get() {
          return utils.cache.Reflect.get(...arguments) // using cached copy
        }
      }
    )
    Reflect.get = () => (sniffResults.stealth = true)
    // trigger get trap
    stealthProxy.foo // eslint-disable-line

    return sniffResults
  })

  t.deepEqual(results, {
    vanilla: true,
    stealth: false
  })
})
