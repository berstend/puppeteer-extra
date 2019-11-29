# puppeteer-extra-plugin-adblocker [![Build Status](https://travis-ci.org/berstend/puppeteer-extra.svg?branch=master)](https://travis-ci.org/berstend/puppeteer-extra) [![npm](https://img.shields.io/npm/v/puppeteer-extra-plugin-adblocker.svg)](https://www.npmjs.com/package/puppeteer-extra-plugin-adblocker)

> A [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugin to block ads and trackers.

## Features

- Extremely efficient adblocker (both in memory usage and raw speed)
- Pure JavaScript implementation
- Effectively blocks all types of ads and tracking
- Small and minimal (only 64KB minified and gzipped)

> Thanks to [@remusao](https://github.com/remusao) for contributing this sweet plugin and [adblocker engine](https://github.com/cliqz-oss/adblocker)! 👏

## Install

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
const adblockerPlugin = require('puppeteer-extra-plugin-adblocker')({
  blockTrackers: true, // default: false
  cacheDir: '/tmp/cache/puppeteer-extra-plugin-adblocker/' // default: no caching
})
puppeteer.use(adblockerPlugin)

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()

  // Visit a page, ads are blocked automatically!
  await page.goto('https://www.google.com/search?q=rent%20a%20car')

  await page.waitForNavigation()
  await page.screenshot({ path: 'response.png', fullPage: true })
  await browser.close()
})
```

## Motivation

Ads and trackers are on most pages and often cost a lot of bandwidth and time
to load pages. Blocking ads and trackers allows pages to load much faster,
because less requests are made and less JavaScript need to run. Also, in cases
where you want to take screenshots of pages, it's nice to have an option to
remove the ads before.
