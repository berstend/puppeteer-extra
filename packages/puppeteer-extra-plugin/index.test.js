'use strict'

const { test } = require('ava')

const PuppeteerExtraPlugin = require('.')

test('is a function', async (t) => {
  t.is(typeof PuppeteerExtraPlugin, 'function')
})

test('will throw when not invoked with new', async (t) => {
  const error = await t.throws(() => PuppeteerExtraPlugin())
  t.is(error.message, `Class constructor PuppeteerExtraPlugin cannot be invoked without 'new'`)
})

test('will throw without a name', async (t) => {
  const error = await t.throws(() => new PuppeteerExtraPlugin())
  t.is(error.message, `Plugin must override "name"`)
})

test('should have the basic class members', async (t) => {
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor (opts = { }) { super(opts) }
    get name () { return pluginName }
  }
  const instance = new Plugin()

  t.is(instance.name, pluginName)
  t.true(instance.requirements instanceof Set)
  t.true(instance.dependencies instanceof Set)
  t.true(instance.data instanceof Array)
  t.is(instance.data.length, 0)
  t.true(instance.debug instanceof Function)
  t.is(instance.debug.namespace, `puppeteer-extra-plugin:${pluginName}`)
  t.true(instance._isPuppeteerExtraPlugin)
})

test('should have the public class members', async (t) => {
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor (opts = { }) { super(opts) }
    get name () { return pluginName }
  }
  const instance = new Plugin()

  t.true(instance.beforeLaunch instanceof Function)
  t.true(instance.afterLaunch instanceof Function)
  t.true(instance.onTargetCreated instanceof Function)
  t.true(instance.onPageCreated instanceof Function)
  t.true(instance.onTargetChanged instanceof Function)
  t.true(instance.onTargetDestroyed instanceof Function)
  t.true(instance.onDisconnected instanceof Function)
  t.true(instance.onClose instanceof Function)
  t.true(instance.onPluginRegistered instanceof Function)
  t.true(instance.getDataFromPlugins instanceof Function)
})

test('should have the internal class members', async (t) => {
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor (opts = { }) { super(opts) }
    get name () { return pluginName }
  }
  const instance = new Plugin()

  t.true(instance._getMissingDependencies instanceof Function)
  t.true(instance._bindBrowserEvents instanceof Function)
  t.true(instance._onTargetCreated instanceof Function)
  t.true(instance._register instanceof Function)
  t.true(instance._registerChildClassMembers instanceof Function)
  t.true(instance._hasChildClassMember instanceof Function)
})
