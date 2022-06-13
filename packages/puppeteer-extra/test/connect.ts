import test from 'ava'
declare const require: any;

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  try {
    delete require.cache[require.resolve('puppeteer-extra')]
    // delete require.cache[require.resolve('puppeteer-extra-plugin')]
  } catch (error) {
    console.log(error)
  }
})

test.serial('will remove headless from remote browser', async t => {
  // Mitigate CI quirks
  try {
    // Launch vanilla puppeteer browser with no plugins
    const puppeteerVanilla = require('puppeteer')
    const browserVanilla = await puppeteerVanilla.launch({
      args: PUPPETEER_ARGS
    })
    const browserWSEndpoint = browserVanilla.wsEndpoint()

    // Use puppeteer-extra with plugin to conntect to existing browser
    const puppeteer = require('puppeteer-extra')
    puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua').default())
    const browser = await puppeteer.connect({ browserWSEndpoint })

    // Let's ensure we've anonymized the user-agent, despite not using .launch
    const page = await browser.newPage()
    const ua = await page.evaluate(() => window.navigator.userAgent)
    t.true(!ua.includes('HeadlessChrome'))

    await browser.close()
    t.true(true)
  } catch (e) {
    const err = e as Error;
    console.log(`Caught error:`, err)
    if (
      err.message &&
      err.message.includes(
        'Session closed. Most likely the page has been closed'
      )
    ) {
      t.true(true) // ignore this error
    } else {
      throw err
    }
  }
})
