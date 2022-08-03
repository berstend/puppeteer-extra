import test from 'ava'

import { PuppeteerExtraPlugin } from '../src'

test.serial('is a function', async t => {
  t.is(typeof PuppeteerExtraPlugin, 'function')
})

test.serial('will throw without a name', async t => {
  class Derived extends PuppeteerExtraPlugin {}
  const error = await t.throws(() => new Derived())
  t.is(error.message, `Plugin must override "name"`)
})

test.serial('should have the basic class members', async t => {
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
  }
  const instance = new Plugin()

  t.is(instance.name, pluginName)
  t.true(instance.requirements instanceof Set)
  t.true(instance.dependencies instanceof Array)
  t.true(instance.dependenciesOptions instanceof Object)
  t.true(instance.data instanceof Array)
  t.true(instance.defaults instanceof Object)
  t.is(instance.data.length, 0)
  t.true(instance.debug instanceof Function)
  t.is(instance.debug.namespace, `puppeteer-extra-plugin:${pluginName}`)
  t.true(instance._isPuppeteerExtraPlugin)
})

test.serial('should have the public class members', async t => {
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
  }
  const instance = new Plugin()

  t.true(instance.beforeLaunch instanceof Function)
  t.true(instance.afterLaunch instanceof Function)
  t.true(instance.onTargetCreated instanceof Function)
  t.true(instance.onBrowser instanceof Function)
  t.true(instance.onPageCreated instanceof Function)
  t.true(instance.onTargetChanged instanceof Function)
  t.true(instance.onTargetDestroyed instanceof Function)
  t.true(instance.onDisconnected instanceof Function)
  t.true(instance.onClose instanceof Function)
  t.true(instance.onPluginRegistered instanceof Function)
  t.true(instance.getDataFromPlugins instanceof Function)
})

test.serial('should have the internal class members', async t => {
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
  }
  const instance = new Plugin()

  t.true(instance._bindBrowserEvents instanceof Function)
  t.true(instance._onTargetCreated instanceof Function)
  t.true(instance._register instanceof Function)
  t.true(instance._registerChildClassMembers instanceof Function)
  t.true(instance._hasChildClassMember instanceof Function)
})

test.serial('should merge opts with defaults automatically', async t => {
  const pluginName = 'hello-world'
  const pluginDefaults = { foo: 'bar', foo2: 'bar2', extra1: 123 }
  const pluginConfig = { foo2: 'bob', extra2: 666 }

  class Plugin extends PuppeteerExtraPlugin<any> {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
    get defaults(): any {
      return pluginDefaults
    }
  }
  const instance = new Plugin(pluginConfig)

  t.deepEqual(instance.defaults, pluginDefaults)
  t.is(instance.opts.foo, pluginDefaults.foo)
  t.is(instance.opts.foo2, pluginConfig.foo2)
  t.is(instance.opts.extra1, pluginDefaults.extra1)
  t.is(instance.opts.extra2, pluginConfig.extra2)
})

test.serial('should have opts when defaults is not defined', async t => {
  const pluginName = 'hello-world'
  const pluginConfig = { foo2: 'bob', extra2: 666 }

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
  }
  const instance = new Plugin(pluginConfig)

  t.deepEqual(instance.opts, pluginConfig)
})
