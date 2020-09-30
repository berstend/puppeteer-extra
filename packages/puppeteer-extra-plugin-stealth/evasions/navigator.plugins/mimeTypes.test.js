const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')

const Plugin = require('.')

test('stealth: will have convincing mimeTypes', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await page.evaluate(() => {
    // We need to help serializing the error or it won't survive being sent back from `page.evaluate`
    const catchErr = function(fn, ...args) {
      try {
        return fn.apply(this, args)
      } catch ({ name, message, stack }) {
        return { name, message, stack, str: stack.split('\n')[0] }
      }
    }

    return {
      mimeTypes: {
        exists: 'mimeTypes' in navigator,
        isArray: Array.isArray(navigator.mimeTypes),
        length: navigator.mimeTypes.length,
        // value: navigator.mimeTypes,
        toString: navigator.mimeTypes.toString(),
        toStringProto: navigator.mimeTypes.__proto__.toString(), // eslint-disable-line no-proto
        protoSymbol: navigator.mimeTypes.__proto__[Symbol.toStringTag], // eslint-disable-line no-proto
        // valueOf: navigator.mimeTypes.valueOf(),
        valueOfSame: navigator.mimeTypes.valueOf() === navigator.mimeTypes,
        json: JSON.stringify(navigator.mimeTypes),
        hasPropPush: 'push' in navigator.mimeTypes,
        hasPropLength: 'length' in navigator.mimeTypes,
        hasLengthDescriptor: !!Object.getOwnPropertyDescriptor(
          navigator.mimeTypes,
          'length'
        ),
        propertyNames: JSON.stringify(
          Object.getOwnPropertyNames(navigator.mimeTypes)
        ),
        lengthInProps: Object.getOwnPropertyNames(navigator.mimeTypes).includes(
          'length'
        ),
        keys: JSON.stringify(Object.keys(navigator.mimeTypes)),
        namedPropsAuthentic: (function() {
          navigator.mimeTypes.alice = 'bob'
          return navigator.mimeTypes.namedItem('alice') === null // true on chrome
        })(),
        loopResult: (function() {
          let res = ''
          for (var bK = 0; bK < window.navigator.mimeTypes.length; bK++)
            bK === window.navigator.mimeTypes.length - 1
              ? (res += window.navigator.mimeTypes[bK].type)
              : (res += window.navigator.mimeTypes[bK].type + ',')
          return res
        })()
      },
      namedItem: {
        exists: 'namedItem' in navigator.mimeTypes,
        toString: navigator.mimeTypes.namedItem.toString(),
        resultNotFound: navigator.mimeTypes.namedItem('foo'),
        resultFound: navigator.mimeTypes // eslint-disable-line no-proto
          .namedItem('application/pdf')
          .__proto__.toString(),
        errors: {
          // For whatever weird reason the normal context doesn't suffice, we need to bind this to `navigator.mimeTypes`
          noArgs: catchErr.bind(navigator.mimeTypes)(
            navigator.mimeTypes.namedItem
          ).str,
          noStackLeaks: !catchErr
            .bind(navigator.mimeTypes)(navigator.mimeTypes.namedItem)
            .stack.includes(`.apply`),
          protoCall: catchErr.bind(navigator.mimeTypes)(
            navigator.mimeTypes.__proto__.namedItem // eslint-disable-line no-proto
          ).str
        }
      },
      item: {
        exists: 'item' in navigator.mimeTypes,
        toString: navigator.mimeTypes.item.toString(),
        resultNotFound: navigator.mimeTypes.item('madness').type,
        resultNotFoundNumberString: navigator.mimeTypes.item('777'),
        resultEmptyString: navigator.mimeTypes.item('').type,
        resultByNumberString: navigator.mimeTypes.item('2').type,
        resultByNumberStringZero: navigator.mimeTypes.item('0').type,
        resultByNumber: navigator.mimeTypes.item(2).type,
        resultNull: navigator.mimeTypes.item(null).type,
        resultFound: navigator.mimeTypes.item('application/x-nacl').type,
        resultBrackets: navigator.mimeTypes['application/x-pnacl'].type,
        errors: {
          // For whatever weird reason the normal context doesn't suffice, we need to bind this to `navigator.mimeTypes`
          noArgs: catchErr.bind(navigator.mimeTypes)(navigator.mimeTypes.item)
            .str,
          noStackLeaks: !catchErr
            .bind(navigator.mimeTypes)(navigator.mimeTypes.item)
            .stack.includes(`.apply`),
          protoCall: catchErr.bind(navigator.mimeTypes)(
            navigator.mimeTypes.__proto__.item // eslint-disable-line no-proto
          ).str
        }
      }
    }
  })

  t.deepEqual(results.mimeTypes, {
    exists: true,
    hasPropPush: false,
    hasPropLength: true,
    hasLengthDescriptor: false,
    isArray: false,
    json: `{"0":{},"1":{},"2":{},"3":{}}`,
    keys: `["0","1","2","3"]`,
    length: 4,
    lengthInProps: false,
    loopResult:
      'application/pdf,application/x-google-chrome-pdf,application/x-nacl,application/x-pnacl',
    namedPropsAuthentic: true,
    propertyNames: `["0","1","2","3","application/pdf","application/x-google-chrome-pdf","application/x-nacl","application/x-pnacl"]`,
    protoSymbol: 'MimeTypeArray',
    toString: '[object MimeTypeArray]',
    toStringProto: '[object MimeTypeArray]',
    valueOfSame: true
  })

  t.deepEqual(results.namedItem, {
    exists: true,
    toString: 'function namedItem() { [native code] }',
    resultFound: '[object MimeType]',
    resultNotFound: null,

    errors: {
      noArgs:
        "TypeError: Failed to execute 'namedItem' on 'MimeTypeArray': 1 argument required, but only 0 present.",
      noStackLeaks: true,
      protoCall: 'TypeError: Illegal invocation'
    }
  })

  t.deepEqual(results.item, {
    exists: true,
    resultBrackets: 'application/x-pnacl',
    resultByNumber: 'application/x-nacl',
    resultByNumberString: 'application/x-nacl',
    resultByNumberStringZero: 'application/pdf',
    resultEmptyString: 'application/pdf',
    resultFound: 'application/pdf',
    resultNotFound: 'application/pdf',
    resultNotFoundNumberString: null,
    resultNull: 'application/pdf',
    toString: 'function item() { [native code] }',
    errors: {
      noArgs:
        "TypeError: Failed to execute 'item' on 'MimeTypeArray': 1 argument required, but only 0 present.",
      noStackLeaks: true,
      protoCall: 'TypeError: Illegal invocation'
    }
  })
})

test('stealth: will have convincing mimeType entry', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await page.evaluate(() => ({
    mimeType: {
      exists: !!navigator.mimeTypes[0],
      toString: navigator.mimeTypes[0].toString(),
      toStringProto: navigator.mimeTypes[0].__proto__.toString(), // eslint-disable-line no-proto
      protoSymbol: navigator.mimeTypes[0].__proto__[Symbol.toStringTag], // eslint-disable-line no-proto
      enabledPlugin: !!navigator.mimeTypes[0].enabledPlugin, // should not throw
      enabledPlugin2: !!navigator.mimeTypes['application/pdf'].enabledPlugin, // should not throw
      enabledPlugins: !!navigator.mimeTypes[0].enabledPlugins, // regression: should not exist (anymore)
      pdfPlugin: JSON.stringify(
        navigator.mimeTypes['application/pdf'].enabledPlugin
      ),
      length: !!navigator.mimeTypes[0].length, // should not throw and return mimeTypes length
      lengthDescriptor: !!Object.getOwnPropertyDescriptor(
        navigator.mimeTypes[0],
        'length'
      ),
      json: JSON.stringify(navigator.mimeTypes[0]),
      propertyNames: JSON.stringify(
        Object.getOwnPropertyNames(navigator.mimeTypes[0])
      ),
      nested:
        navigator.mimeTypes['application/pdf'].enabledPlugin[0].enabledPlugin[0]
          .enabledPlugin[0].enabledPlugin[0].enabledPlugin[0].suffixes
    }
  }))
  t.deepEqual(results.mimeType, {
    exists: true,
    protoSymbol: 'MimeType',
    toString: '[object MimeType]',
    toStringProto: '[object MimeType]',
    enabledPlugin: true,
    enabledPlugin2: true,
    enabledPlugins: false,
    pdfPlugin: '{"0":{}}',
    length: false,
    lengthDescriptor: false,
    json: '{}',
    propertyNames: '[]',
    nested: 'pdf'
  })
})
