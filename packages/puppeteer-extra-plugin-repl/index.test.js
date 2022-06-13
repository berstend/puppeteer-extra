'use strict'

const PLUGIN_NAME = 'repl'

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
  t.true(childClassMembers.includes('defaults'))
  t.true(childClassMembers.includes('requirements'))
  t.true(childClassMembers.includes('repl'))
  t.true(childClassMembers.includes('onPageCreated'))
  t.true(childClassMembers.length === 6)
})

test.serial('should have opts with default values', async t => {
  const instance = Plugin()
  const opts = instance.opts

  t.is(opts.addToPuppeteerClass, true)
})
