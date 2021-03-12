'use strict'

const test = require('ava')

const { wrap } = require('@extra-test/wrap')

wrap(test)(['playwright:all', 'puppeteer:all'])(
  'will correctly determine env',
  async (t, driver) => {
    const { launcher, browser } = await driver.getPage()

    t.is(launcher.env.browserName, driver.browserName)
    t.is(launcher.env.driverName, driver.driverName)

    await browser.close()
  }
)
