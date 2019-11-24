'use strict'

const puppeteer = require('puppeteer-extra')
puppeteer.use(require('puppeteer-extra-plugin-stealth')())

const detectHeadless = require('./detect-headless')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  page.on('console', msg => {
    console.log('Page console: ', msg.text())
  })

  await page.goto('about:blank')
  const detectionResults = await page.evaluate(detectHeadless)
  console.assert(
    Object.keys(detectionResults).length,
    'No detection results returned.'
  )

  await browser.close()
})()
