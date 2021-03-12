import test from 'ava'

import { addExtraPlaywright } from '../src/index'

import * as playwright from 'playwright'

import { AutomationExtraPlugin, FilterString } from 'automation-extra-plugin'

test('will filter plugins correctly', async t => {
  class Plugin1 extends AutomationExtraPlugin {
    static id = 'plugin1'

    constructor(opts = {}) {
      super(opts)
    }

    get filter() {
      return {
        include: ['playwright:chromium', 'puppeteer:chromium'] as FilterString[]
      }
    }
  }
  class Plugin2 extends AutomationExtraPlugin {
    static id = 'plugin2'

    constructor(opts = {}) {
      super(opts)
    }

    get filter() {
      return {
        exclude: ['playwright:chromium', 'puppeteer:chromium'] as FilterString[]
      }
    }
  }
  class Plugin3 extends AutomationExtraPlugin {
    static id = 'plugin3'

    constructor(opts = {}) {
      super(opts)
    }

    get filter() {
      return { include: ['puppeteer:chromium'] as FilterString[] }
    }
  }

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(new Plugin1())
  chromium.use(new Plugin2())
  chromium.use(new Plugin3())
  t.deepEqual(
    chromium.plugins.filteredPlugins.map(p => p.name),
    ['plugin1']
  )

  const firefox = addExtraPlaywright(playwright.firefox)
  firefox.use(new Plugin1())
  firefox.use(new Plugin2())
  firefox.use(new Plugin3())
  t.deepEqual(
    firefox.plugins.filteredPlugins.map(p => p.name),
    ['plugin2']
  )
})

test('child plugins will inherit from parent', async t => {
  class Plugin1 extends AutomationExtraPlugin {
    static id = 'plugin1'

    constructor(opts = {}) {
      super(opts)
    }
  }
  class Meta1 extends AutomationExtraPlugin {
    static id = 'meta1'

    constructor(opts = {}) {
      super(opts)
    }

    get filter() {
      return {
        exclude: ['playwright:chromium', 'puppeteer:chromium'] as FilterString[]
      }
    }

    get plugins() {
      return [new Plugin1()]
    }
  }

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(new Meta1())
  chromium.plugins.resolveDependencies()
  t.deepEqual(
    chromium.plugins.filteredPlugins.map(p => p.name),
    []
  )

  const firefox = addExtraPlaywright(playwright.firefox)
  firefox.use(new Meta1())
  firefox.plugins.resolveDependencies()
  t.deepEqual(
    firefox.plugins.filteredPlugins.map(p => p.name),
    ['meta1', 'plugin1']
  )
})

test('child plugins will inherit from parent unless overwritten', async t => {
  class Plugin1 extends AutomationExtraPlugin {
    static id = 'plugin1'

    constructor(opts = {}) {
      super(opts)
    }

    get filter() {
      return {
        include: ['playwright:chromium', 'puppeteer:firefox'] as FilterString[]
      }
    }
  }
  class Meta1 extends AutomationExtraPlugin {
    static id = 'meta1'

    constructor(opts = {}) {
      super(opts)
    }

    get filter() {
      return {
        exclude: ['playwright:chromium', 'puppeteer:chromium'] as FilterString[]
      }
    }

    get plugins() {
      return [new Plugin1()]
    }
  }

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(new Meta1())
  chromium.plugins.resolveDependencies()
  t.deepEqual(
    chromium.plugins.filteredPlugins.map(p => p.name),
    ['plugin1']
  )

  const firefox = addExtraPlaywright(playwright.firefox)
  firefox.use(new Meta1())
  firefox.plugins.resolveDependencies()
  t.deepEqual(
    firefox.plugins.filteredPlugins.map(p => p.name),
    ['meta1']
  )
})
