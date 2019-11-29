# puppeteer-extra-plugin-adblocker [![Build Status](https://travis-ci.org/berstend/puppeteer-extra.svg?branch=master)](https://travis-ci.org/berstend/puppeteer-extra) [![npm](https://img.shields.io/npm/v/puppeteer-extra-plugin-adblocker.svg)](https://www.npmjs.com/package/puppeteer-extra-plugin-adblocker)

> A [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugin to block ads and trackers.

## Features

- Extremely efficient adblocker (both in memory usage and raw speed)
- Pure JavaScript implementation
- Effectively blocks all types of ads and tracking
- Small and minimal (only 64KB minified and gzipped)

> Thanks to [@remusao](https://github.com/remusao) for contributing this sweet plugin and [adblocker engine](https://github.com/cliqz-oss/adblocker)! 👏

## Installation

```bash
yarn add puppeteer-extra-plugin-adblocker
# - or -
npm install puppeteer-extra-plugin-adblocker
```

If this is your first [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugin here's everything you need:

```bash
yarn add puppeteer puppeteer-extra puppeteer-extra-plugin-adblocker
# - or -
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-adblocker
```

## Usage

The plugin enables adblocking in puppeteer, optionally blocking trackers.

```javascript
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// Add adblocker plugin, which will transparently block ads in all pages you
// create using puppeteer.
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin())

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()
  // Visit a page, ads are blocked automatically!
  await page.goto('https://www.google.com/search?q=rent%20a%20car')

  await page.waitFor(5 * 1000)
  await page.screenshot({ path: 'response.png', fullPage: true })

  console.log(`All done, check the screenshots. ✨`)
  await browser.close()
})
```

<details>
 <summary><strong>TypeScript usage</strong></summary><br/>

```ts
import puppeteer from 'puppeteer-extra'
import Adblocker from 'puppeteer-extra-plugin-adblocker'

puppeteer.use(Adblocker({ blockTrackers: true }))

puppeteer
  .launch({ headless: false, defaultViewport: null })
  .then(async browser => {
    const page = await browser.newPage()
    await page.goto('https://www.vanityfair.com')
    await page.waitFor(60 * 1000)
    await browser.close()
  })
```

</details>

## Options

Usage:

```js
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const adblocker = AdblockerPlugin({
  blockTrackers: true // default: false
})
puppeteer.use(adblocker)
```

Available options:

```ts
interface PluginOptions {
  /** Whether or not to block trackers (in addition to ads). Default: false */
  blockTrackers: boolean
  /** Persist adblocker engine cache to disk for speedup. Default: true */
  useCache: boolean
  /** Optional custom directory for adblocker cache files. Default: undefined */
  cacheDir?: string
}
```

## Motivation

Ads and trackers are on most pages and often cost a lot of bandwidth and time
to load pages. Blocking ads and trackers allows pages to load much faster,
because less requests are made and less JavaScript need to run. Also, in cases
where you want to take screenshots of pages, it's nice to have an option to
remove the ads before.
