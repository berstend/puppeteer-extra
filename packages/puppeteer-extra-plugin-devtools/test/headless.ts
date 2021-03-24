import test from 'ava'
import puppeteer from 'puppeteer-extra'
import devtoolsLoader from 'puppeteer-extra-plugin-devtools'

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[require.resolve('puppeteer-extra-plugin-devtools')]
})

test('will create a tunnel', async t => {
  const devtools = devtoolsLoader()
  puppeteer.use(devtools)
  devtools.setAuthCredentials('bob', 'swordfish')

  await puppeteer.launch({ args: PUPPETEER_ARGS }).then(async browser => {
    debugger;
    const tunnel = await devtools.createTunnel(browser)
    t.true(tunnel.url.includes('https://devtools-tunnel-'))
    // t.true(tunnel.url.includes('.localtunnel.me')) // old value
    t.true(tunnel.url.includes('.loca.lt'))
    browser.close()
  })
  t.true(true)
})

test('will create a tunnel with custom localtunnel options', async t => {
  const devtools = devtoolsLoader({
    auth: { user: 'francis', pass: 'president' },
    localtunnel: {
      host: 'https://tunnel.datahub.at'
    }
  })
  puppeteer.use(devtools)

  await puppeteer.launch({ args: PUPPETEER_ARGS }).then(async browser => {
    const tunnel = await devtools.createTunnel(browser)
    t.true(tunnel.url.includes('.tunnel.datahub.at'))
    browser.close()
  })
  t.true(true)
})
