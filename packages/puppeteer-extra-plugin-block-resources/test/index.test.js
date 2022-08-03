'use strict'

const PLUGIN_NAME = 'block-resources'

const test = require('ava')

const { default: getPlugin, Plugin } = require('..')

test.serial('is a function', async t => {
  t.is(typeof Plugin, 'function')
})

test.serial('should have the basic class members', async t => {
  const instance = getPlugin()
  t.is(instance.name, PLUGIN_NAME)
  t.true(instance._isPuppeteerExtraPlugin)
})

test.serial('should have the public child class members', async t => {
  const instance = getPlugin()
  const prototype = Object.getPrototypeOf(instance)
  const childClassMembers = Object.getOwnPropertyNames(prototype)

  t.true(childClassMembers.includes('constructor'))
  t.true(childClassMembers.includes('name'))
  t.true(childClassMembers.includes('defaults'))
  t.true(childClassMembers.includes('availableTypes'))
  t.true(childClassMembers.includes('blockedTypes'))
  t.true(childClassMembers.includes('interceptResolutionPriority'))
  t.true(childClassMembers.includes('onRequest'))
  t.true(childClassMembers.includes('onPageCreated'))
  t.true(childClassMembers.length === 8)
})

test.serial('should have opts with default values', async t => {
  const instance = getPlugin()
  t.deepEqual(instance.opts.blockedTypes, new Set([]))
  t.is(instance.opts.availableTypes.size, 13)
  t.is(instance.opts.interceptResolutionPriority, undefined)
})
