'use strict'

const test = require('ava')

const {
  DevToolsCommon,
  DevToolsLocal,
  DevToolsTunnel
} = require('./RemoteDevTools')

const webSocketDebuggerUrl =
  'ws://127.0.0.1:9222/devtools/browser/ec78d039-2f19-4c6f-a08e-bcaf88e34b69'

test('is a function', async t => {
  t.is(typeof DevToolsCommon, 'function')
  t.is(typeof DevToolsLocal, 'function')
  t.is(typeof DevToolsTunnel, 'function')
})

test('will throw when missing webSocketDebuggerUrl', async t => {
  const error = await t.throws(() => new DevToolsCommon())
  t.is(
    error.message,
    'Expected argument to be of type `string` but received type `undefined`'
  ) // eslint-disable-line
})

test('DevToolsLocal: has basic functionality', async t => {
  const instance = new DevToolsLocal(webSocketDebuggerUrl)
  t.is(instance.url, 'http://localhost:9222')
  t.is(
    instance.getUrlForPageId('foobar'),
    'http://localhost:9222/devtools/inspector.html?ws=localhost:9222/devtools/page/foobar'
  )
})

test('DevToolsTunnel: has basic functionality', async t => {
  const instance = new DevToolsTunnel(webSocketDebuggerUrl)
  instance.tunnel = { url: 'https://faketunnel.com' }
  instance.tunnelHost = 'faketunnel.com'
  t.is(instance.url, instance.tunnel.url)
  t.is(
    instance.getUrlForPageId('foobar'),
    'https://faketunnel.com/devtools/inspector.html?wss=faketunnel.com/devtools/page/foobar'
  )
})

test('DevToolsTunnel: has defaults', async t => {
  const instance = new DevToolsTunnel(webSocketDebuggerUrl)

  t.is(instance.opts.prefix, 'devtools-tunnel')
  t.is(instance.opts.subdomain, null)
  t.deepEqual(instance.opts.auth, { user: null, pass: null })
})

test('DevToolsTunnel: has public members', async t => {
  const instance = new DevToolsTunnel(webSocketDebuggerUrl)

  t.true(instance.create instanceof Function)
  t.true(instance.close instanceof Function)
})
