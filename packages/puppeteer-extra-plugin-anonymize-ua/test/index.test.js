const test = require('ava')
// import test from 'ava';
// import { Plugin, default as getPlugin } from '..'
const { Plugin, default: getPlugin } = require('..')

const PLUGIN_NAME = 'anonymize-ua'

test.serial('is a function', async t => {
  t.is(typeof Plugin, 'function')
})

test.serial('default export should be a getInstance() function', async t => {
  const instance = getPlugin()
  t.is(instance.name, PLUGIN_NAME)
  t.true(instance._isPuppeteerExtraPlugin)
})

test.serial('should have the basic class members', async t => {
  const instance = new Plugin()
  t.is(instance.name, PLUGIN_NAME)
  t.true(instance._isPuppeteerExtraPlugin)
})

test.serial('should have the public child class members', async t => {
  const instance = new Plugin()
  const prototype = Object.getPrototypeOf(instance)
  const childClassMembers = Object.getOwnPropertyNames(prototype)

  t.true(childClassMembers.includes('constructor'))
  t.true(childClassMembers.includes('name'))
  t.true(childClassMembers.includes('defaults'))
  t.true(childClassMembers.includes('onPageCreated'))
  t.true(childClassMembers.length === 4)
})

test.serial('should have opts with default values', async t => {
  const instance = new Plugin()
  const opts = instance.opts

  t.is(opts.stripHeadless, true)
  t.is(opts.makeWindows, true)
  t.is(opts.customFn, null)
})
