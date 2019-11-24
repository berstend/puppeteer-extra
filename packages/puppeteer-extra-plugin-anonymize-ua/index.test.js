'use strict'

const PLUGIN_NAME = 'anonymize-ua'

const test = require('ava')

const Plugin = require('.')

test('is a function', async t => {
  t.is(typeof Plugin, 'function')
})

test('should have the basic class members', async t => {
  const instance = new Plugin()

  t.is(instance.name, PLUGIN_NAME)
  t.true(instance._isPuppeteerExtraPlugin)
})

test('should have the public child class members', async t => {
  const instance = new Plugin()
  const prototype = Object.getPrototypeOf(instance)
  const childClassMembers = Object.getOwnPropertyNames(prototype)

  t.true(childClassMembers.includes('constructor'))
  t.true(childClassMembers.includes('name'))
  t.true(childClassMembers.includes('defaults'))
  t.true(childClassMembers.includes('onPageCreated'))
  t.true(childClassMembers.length === 4)
})

test('should have opts with default values', async t => {
  const instance = new Plugin()
  const opts = instance.opts

  t.is(opts.stripHeadless, true)
  t.is(opts.makeWindows, true)
  t.is(opts.customFn, null)
})
