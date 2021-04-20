const PLUGIN_NAME = 'repl'

import test from 'ava'

import Plugin from '../src'

test('is a function', async t => {
  t.is(typeof Plugin, 'function')
})

test('should have the basic class members', async t => {
  const instance = Plugin()
  t.is(instance.name, PLUGIN_NAME)
  t.true(instance._isPuppeteerExtraPlugin)
})

test('should have the public child class members', async t => {
  const instance = Plugin()
  const prototype = Object.getPrototypeOf(instance)
  const childClassMembers = Object.getOwnPropertyNames(prototype)

  t.true(childClassMembers.includes('constructor'))
  t.true(childClassMembers.includes('name'))
  t.true(childClassMembers.includes('defaults'))
  t.true(childClassMembers.includes('requirements'))
  t.true(childClassMembers.includes('repl'))
  t.true(childClassMembers.includes('onPageCreated'))
  t.true(childClassMembers.length === 6)
})

test('should have opts with default values', async t => {
  const instance = Plugin()
  const opts = instance.opts

  t.is(opts.addToPuppeteerClass, true)
})
