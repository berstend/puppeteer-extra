'use strict'

const PLUGIN_NAME = 'stealth'

const { test } = require('ava')

const Plugin = require('.')

test('is a function', async (t) => {
  t.is(typeof Plugin, 'function')
})

test('should have the basic class members', async (t) => {
  const instance = new Plugin()
  t.is(instance.name, PLUGIN_NAME)
  t.true(instance._isPuppeteerExtraPlugin)
})

test('should have the public child class members', async (t) => {
  const instance = new Plugin()
  const prototype = Object.getPrototypeOf(instance)
  const childClassMembers = Object.getOwnPropertyNames(prototype)

  t.true(childClassMembers.includes('constructor'))
  t.true(childClassMembers.includes('name'))
  t.true(childClassMembers.includes('name'))
  t.true(childClassMembers.includes('defaults'))
  t.true(childClassMembers.includes('availableEvasions'))
  t.true(childClassMembers.includes('enabledEvasions'))
  t.true(childClassMembers.length === 6)
})

test('should have opts with default values', async (t) => {
  const instance = new Plugin()
  t.deepEqual(instance.opts.enabledEvasions, instance.availableEvasions)
})

test('should add all dependencies dynamically', async (t) => {
  const instance = new Plugin()
  const deps = new Set([...instance.opts.enabledEvasions]
    .map(e => `${PLUGIN_NAME}/evasions/${e}`)
  )
  t.deepEqual(instance.dependencies, deps)
})

test('should add all dependencies dynamically including changes', async (t) => {
  const instance = new Plugin()
  const fakeDep = 'foobar'
  instance.enabledEvasions = new Set([fakeDep])
  t.deepEqual(instance.dependencies, new Set([`${PLUGIN_NAME}/evasions/${fakeDep}`]))
})
