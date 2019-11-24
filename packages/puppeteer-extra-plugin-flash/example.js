'use strict'

const puppeteer = require('puppeteer-extra')

// This might not be the flashPath you're looking for. ;-)
const userName = require('os').userInfo().username
const pluginPath = `
  /Users/${userName}/Library/Application Support/Google/Chrome/PepperFlash/29.0.0.171/PepperFlashPlayer.plugin
`.trim()
const pluginVersion = '29.0.0.171'

// Will implicitely require 'user-preferences' which will require 'user-data-dir'
// When using default Chromium the pluginPath/pluginVersion need to be specified
puppeteer.use(
  require('puppeteer-extra-plugin-flash')({
    pluginPath,
    pluginVersion
  })
)
;(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('http://ultrasounds.com', { waitUntil: 'domcontentloaded' })
})()
