'use strict'

import puppeteer from 'puppeteer-extra'
import plugin, { ExtandPage } from 'puppeteer-extra-plugin-click-and-wait'

puppeteer.use(plugin())
;(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage() as ExtandPage;
  await page.goto('https://example.com/', { waitUntil: 'domcontentloaded' })
  console.log('clicking on first link')
  await page.clickAndWaitForNavigation('a')
  console.log('all done')
})()
