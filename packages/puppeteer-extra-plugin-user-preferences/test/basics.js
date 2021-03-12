'use strict'

const PLUGIN_NAME = 'user-preferences'

const test = require('ava')

const Plugin = require('puppeteer-extra-plugin-user-preferences')

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
  t.true(childClassMembers.includes('data'))
  t.true(childClassMembers.includes('beforeLaunch'))
})
