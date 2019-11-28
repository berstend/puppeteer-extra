'use strict'

const test = require('ava')

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[require.resolve('puppeteer-extra-plugin-devtools')]
})

test('will create a tunnel', async t => {
  const puppeteer = require('puppeteer-extra')
  const devtools = require('puppeteer-extra-plugin-devtools')()
  puppeteer.use(devtools)
  devtools.setAuthCredentials('bob', 'swordfish')

  await puppeteer.launch({ args: PUPPETEER_ARGS }).then(async browser => {
    const tunnel = await devtools.createTunnel(browser)
    t.true(tunnel.url.includes('https://devtools-tunnel-'))
    t.true(tunnel.url.includes('.localtunnel.me'))
    browser.close()
  })
  t.true(true)
})
