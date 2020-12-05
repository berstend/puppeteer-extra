import test from 'ava'

import { addExtraPlaywright } from '../src/index'

import * as playwright from 'playwright'

import { AutomationExtraPlugin } from 'automation-extra-plugin'

test('will add other plugins correctly', async t => {
  class Plugin1 extends AutomationExtraPlugin {
    static id = 'plugin1'

    constructor(opts = {}) {
      super(opts)
    }
  }

  class MetaPlugin extends AutomationExtraPlugin {
    static id = 'meta'

    constructor(opts = {}) {
      super(opts)
    }

    get plugins() {
      return [new Plugin1()]
    }
  }

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(new MetaPlugin())

  chromium.plugins.resolveDependencies()

  t.deepEqual(chromium.plugins.names, ['meta', 'plugin1'])
})
