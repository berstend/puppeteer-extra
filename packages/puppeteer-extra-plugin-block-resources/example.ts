'use strict'

//
// With debug logs:
// DEBUG=puppeteer-extra,puppeteer-extra-plugin,puppeteer-extra-plugin:* node example.js
//

// const puppeteer = require('puppeteer-extra')
// puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
//   blockedTypes: new Set(['image', 'stylesheet'])
// }))
// ;(async () => {
//   const browser = await puppeteer.launch({ headless: false })
//   const page = await browser.newPage()
//   await page.goto('http://www.msn.com/', {waitUntil: 'domcontentloaded'})
//   console.log('all done')
// })()

const puppeteer = require('puppeteer-extra')
const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')()
puppeteer.use(blockResourcesPlugin)
;(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  blockResourcesPlugin.blockedTypes.add('image')
  await page.goto('http://www.msn.com/', { waitUntil: 'domcontentloaded' })

  blockResourcesPlugin.blockedTypes.add('stylesheet')
  blockResourcesPlugin.blockedTypes.add('other') // e.g. favicon
  await page.goto('http://news.ycombinator.com', {
    waitUntil: 'domcontentloaded'
  })

  blockResourcesPlugin.blockedTypes.delete('stylesheet')
  blockResourcesPlugin.blockedTypes.delete('other')
  blockResourcesPlugin.blockedTypes.add('media')
  blockResourcesPlugin.blockedTypes.add('script')
  await page.goto('http://www.youtube.com', { waitUntil: 'domcontentloaded' })

  console.log('all done')
})()
