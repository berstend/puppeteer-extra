import test from 'ava'

import { addExtraPlaywright } from '../src/index'

import playwright from 'playwright'

import { AutomationExtraPlugin } from 'automation-extra-plugin'

test('will resolve plugin dependencies correctly', async t => {
  class Plugin extends AutomationExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return 'foobar'
    }

    get dependencies() {
      return new Set(['does-not-exist'])
    }
  }

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(new Plugin())

  const error = await t.throwsAsync(async () => chromium.launch())
  t.true(
    error.message.includes(`A plugin listed 'does-not-exist' as dependency`)
  )
})
test('will resolve plugin dependencies as Map correctly', async t => {
  class Plugin extends AutomationExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return 'foobar'
    }

    get dependencies() {
      return new Map([['does-not-exist-too', { beCool: true }]])
    }
  }

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(new Plugin())

  const error = await t.throwsAsync(async () => chromium.launch())
  t.true(
    error.message.includes(`A plugin listed 'does-not-exist-too' as dependency`)
  )
})
