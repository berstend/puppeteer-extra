const test = require('node:test')
const assert = require('node:assert/strict')
const { buildBrowserArgs } = require('../probes/playwright-extra')

test('buildBrowserArgs does not force chrome channel unless configured', () => {
  const args = buildBrowserArgs({
    lane: { browser: { headless: true } },
    profileMode: { browser: {} }
  })
  assert.equal(args.headless, true)
  assert.equal('channel' in args, false)
})

test('buildBrowserArgs preserves explicit channel and proxy', () => {
  const args = buildBrowserArgs({
    lane: { browser: { headless: false, channel: 'chrome' }, proxyServer: 'socks5://127.0.0.1:7890' },
    profileMode: { browser: {} }
  })
  assert.equal(args.headless, false)
  assert.equal(args.channel, 'chrome')
  assert.deepEqual(args.proxy, { server: 'socks5://127.0.0.1:7890' })
})
