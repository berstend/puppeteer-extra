const test = require('ava')

const { vanillaPuppeteer } = require('../../test/util')

const utils = require('./utils')

/* global HTMLMediaElement */

test('splitObjPath: will do what it says', async t => {
  const { objName, propName } = utils.splitObjPath(
    'HTMLMediaElement.prototype.canPlayType'
  )
  t.is(objName, 'HTMLMediaElement.prototype')
  t.is(propName, 'canPlayType')
})

test('patchToString: will work correctly', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // Test verbatim string replacement
  const test1 = await utils.withUtils.evaluate(page, utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType, 'bob')
    return HTMLMediaElement.prototype.canPlayType.toString()
  })
  t.is(test1, 'bob')

  // Test automatic mode derived from `.name`
  const test2 = await utils.withUtils.evaluate(page, utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType)
    return HTMLMediaElement.prototype.canPlayType.toString()
  })
  t.is(test2, 'function canPlayType() { [native code] }')

  // Make sure automatic mode derived from `.name` works with proxies
  const test3 = await utils.withUtils.evaluate(page, utils => {
    HTMLMediaElement.prototype.canPlayType = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      {}
    )
    utils.patchToString(HTMLMediaElement.prototype.canPlayType)
    return HTMLMediaElement.prototype.canPlayType.toString()
  })
  t.is(test3, 'function canPlayType() { [native code] }')

  // Actually verify there's an issue when using vanilla Proxies
  const test4 = await utils.withUtils.evaluate(page, utils => {
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
    await utils.withUtils.evaluate(page, utils => {
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
  const result = await utils.withUtils.evaluate(page, utils => {
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
      iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      )
    }
  })
  t.deepEqual(result, {
    direct: 'bob',
    directWithiframe: 'function canPlayType() { [native code] }',
    iframeWithiframe: 'function canPlayType() { [native code] }'
  })
})

test('patchToString: stealth has no iframe issues', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // Patch all documents and `window.parent` as well
  await utils.withUtils.evaluateOnNewDocument(page, utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType, 'alice')
    utils.patchToString(
      window.parent.HTMLMediaElement.prototype.canPlayType,
      'ebola'
    )
  })
  await page.goto('about:blank')

  const result = await utils.withUtils.evaluate(page, utils => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    return {
      direct: Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      )
    }
  })
  t.deepEqual(result, {
    direct: 'ebola',
    directWithiframe: 'ebola',
    iframeWithiframe: 'alice'
  })
})

test('stripProxyFromErrors: will work correctly', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await utils.withUtils.evaluate(page, utils => {
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
        return Reflect.get(...(arguments || []))
      },
      apply() {
        return Reflect.apply(...arguments)
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

  const results = await utils.withUtils.evaluate(page, utils => {
    utils.replaceProperty(Object.getPrototypeOf(navigator), 'languages', {
      get: () => ['de-DE']
    })
    return {
      propNamesLength: Object.getOwnPropertyNames(navigator).length
    }
  })
  t.is(results.propNamesLength, 0)
})
