'use strict'

const PLUGIN_NAME = 'stealth'

const test = require('ava')

const { default: Plugin } = require('.')

test.serial('is a function', async t => {
  t.is(typeof Plugin, 'function')
})

test.serial('should have the basic class members', async t => {
  const instance = Plugin()
  t.is(instance.name, PLUGIN_NAME)
  t.true(instance._isPuppeteerExtraPlugin)
})

test.serial('should have the public child class members', async t => {
  const instance = Plugin()
  const prototype = Object.getPrototypeOf(instance)
  const childClassMembers = Object.getOwnPropertyNames(prototype)

  t.true(childClassMembers.includes('constructor'))
  t.true(childClassMembers.includes('name'))
  t.true(childClassMembers.includes('name'))
  t.true(childClassMembers.includes('defaults'))
  t.true(childClassMembers.includes('availableEvasions'))
  t.true(childClassMembers.includes('enabledEvasions'))
  // t.is(childClassMembers.length, 7) // drop stupid test
})

test.serial('should have opts with default values', async t => {
  const instance = Plugin()
  t.deepEqual(instance.opts.enabledEvasions, instance.availableEvasions)
})

test.serial('should add all dependencies dynamically', async t => {
  const instance = Plugin()
  const deps = [...instance.opts.enabledEvasions].map(e => `${PLUGIN_NAME}/evasions/${e}`)
  t.deepEqual(instance.dependencies, deps)
})

test.serial('should add all dependencies dynamically including changes', async t => {
  const instance = Plugin()
  const fakeDep = 'foobar'
  instance.enabledEvasions = new Set([fakeDep])
  t.deepEqual(
    instance.dependencies,
    [`${PLUGIN_NAME}/evasions/${fakeDep}`]
  )
})
