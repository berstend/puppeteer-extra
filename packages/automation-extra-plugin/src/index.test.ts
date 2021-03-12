import test from 'ava'

import { AutomationExtraPlugin } from '.'

test('is a function', async (t) => {
  t.is(typeof AutomationExtraPlugin, 'function')
})

test('will throw without an id', async (t) => {
  class Derived extends AutomationExtraPlugin {}
  const error = t.throws(() => new Derived().id)
  t.is(error.message, `Plugin must override "id"`)
})

test('should have the basic class members', async (t) => {
  const pluginName = 'hello-world'
  class Plugin extends AutomationExtraPlugin {
    static id = pluginName

    constructor(opts = {}) {
      super(opts)
    }
  }
  const instance = new Plugin()

  t.is(instance.id, pluginName)
  t.is(instance.name, pluginName) /* tslint:disable-line */
  t.true(instance.requirements instanceof Set)
  t.true(instance.dependencies instanceof Set)
  t.true(instance.defaults instanceof Object)
  t.true(instance.debug instanceof Function)
  t.is(instance.debug.namespace, `automation-extra-plugin:${pluginName}`)
  t.true(instance._isAutomationExtraPlugin)
})

test('should have an id', async (t) => {
  const pluginName = 'hello-world'
  class Plugin extends AutomationExtraPlugin {
    static id = pluginName

    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return pluginName
    }
  }

  t.is(Plugin.id, pluginName)
  const instance = new Plugin()
  t.is(instance.id, pluginName)
  t.is(instance.debug.namespace, `automation-extra-plugin:${pluginName}`)
})

test('should have an id with getter', async (t) => {
  const pluginName = 'hello-world2'
  class Plugin extends AutomationExtraPlugin {
    static get id() {
      return pluginName
    }

    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return pluginName
    }
  }

  t.is(Plugin.id, pluginName)
  const instance = new Plugin()
  t.is(instance.id, pluginName)
  t.is(instance.debug.namespace, `automation-extra-plugin:${pluginName}`)
})

test('should have the public class members', async (t) => {
  const pluginName = 'hello-world'
  class Plugin extends AutomationExtraPlugin {
    static id = pluginName
    constructor(opts = {}) {
      super(opts)
    }
  }
  const instance = new Plugin()

  t.true(instance.beforeConnect instanceof Function)
  t.true(instance.afterConnect instanceof Function)
  t.true(instance.beforeLaunch instanceof Function)
  t.true(instance.afterLaunch instanceof Function)
  t.true(instance.onBrowser instanceof Function)
  t.true(instance.beforeContext instanceof Function)
  t.true(instance.onContextCreated instanceof Function)
  t.true(instance.onPageCreated instanceof Function)
  t.true(instance.onPageClose instanceof Function)
  t.true(instance.onContextClose instanceof Function)
  t.true(instance.onDisconnected instanceof Function)
  t.true(instance.onPluginRegistered instanceof Function)
})

test('should merge opts with defaults automatically', async (t) => {
  const pluginName = 'hello-world'
  const pluginDefaults = { foo: 'bar', foo2: 'bar2', extra1: 123 }
  const userOpts = { foo2: 'bob', extra2: 666 }

  class Plugin extends AutomationExtraPlugin {
    static id = pluginName
    constructor(opts = {}) {
      super(opts)
    }
    get defaults() {
      return pluginDefaults
    }
  }
  const instance = new Plugin(userOpts)

  t.deepEqual(instance.defaults, pluginDefaults)
  t.is(instance.opts.foo, pluginDefaults.foo)
  t.is(instance.opts.foo2, userOpts.foo2)
  t.is(instance.opts.extra1, pluginDefaults.extra1)
  t.is(instance.opts.extra2, userOpts.extra2)
})

test('should merge opts with Sets correctly', async (t) => {
  const pluginName = 'hello-world'
  const pluginDefaults = {
    x1: false,
    x2: true,
    x3: ['foo'],
    x4: new Set(['alice', 'bob', 'francis']),
  }
  const userOpts = {
    x2: false,
    x3: ['bar'],
    x4: new Set(['alice', 'bob', 'frank']),
  }

  class Plugin extends AutomationExtraPlugin {
    static id = pluginName
    constructor(opts = {}) {
      super(opts)
    }
    get defaults() {
      return pluginDefaults
    }
  }
  const instance = new Plugin(userOpts)

  t.deepEqual(instance.opts, {
    x1: false,
    x2: false,
    x3: ['bar'],
    x4: new Set(['alice', 'bob', 'frank']),
  })
})

test('should have opts when defaults is not defined', async (t) => {
  const pluginName = 'hello-world'
  const userOpts = { foo2: 'bob', extra2: 666 }

  class Plugin extends AutomationExtraPlugin {
    static id = pluginName
    constructor(opts = {}) {
      super(opts)
    }
  }
  const instance = new Plugin(userOpts)

  t.deepEqual(instance.opts, userOpts)
})
