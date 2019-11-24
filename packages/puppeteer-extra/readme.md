# puppeteer-extra [![Build Status](https://travis-ci.org/berstend/puppeteer-extra.svg?branch=master)](https://travis-ci.org/berstend/puppeteer-extra) [![npm](https://img.shields.io/npm/v/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra) [![npm](https://img.shields.io/npm/dt/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra) [![npm](https://img.shields.io/npm/l/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra)

> A light-weight wrapper around [`puppeteer`](https://github.com/GoogleChrome/puppeteer) to enable cool [plugins](#plugins) through a clean interface.

<a href="https://github.com/berstend/puppeteer-extra"><img src="https://i.imgur.com/qtlnoQL.png" width="279px" height="187px" align="right" /></a>

## Installation

```bash
yarn add puppeteer puppeteer-extra
# - or -
npm install puppeteer puppeteer-extra
```

_You can also use a specific puppeteer version:_

```bash
# puppeteer-extra works with any version, e.g. the prerelease:
yarn add puppeteer@next puppeteer-extra
```

## Quickstart

```es6
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality.
// Any number of plugins can be added through `puppeteer.use()`
const puppeteer = require('puppeteer-extra')

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// Add plugin to anonymize the User-Agent and signal Windows as platform
const UserAgentPlugin = require('puppeteer-extra-plugin-anonymize-ua')
puppeteer.use(UserAgentPlugin({ makeWindows: true }))

// That's it, the rest is puppeteer usage as normal 😊
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })

  console.log(`Testing the user agent plugin..`)
  await page.goto('https://httpbin.org/headers')
  await page.waitFor(1000)
  await page.screenshot({ path: 'headers.png', fullPage: true })

  console.log(`Testing the stealth plugin..`)
  await page.goto('https://bot.sannysoft.com')
  await page.waitFor(5000)
  await page.screenshot({ path: 'stealth.png', fullPage: true })

  console.log(`All done, check the screenshots. ✨`)
  await browser.close()
})
```

The above example uses the [`stealth`](/packages/puppeteer-extra-plugin-stealth) and [`anonymize-ua`](/packages/puppeteer-extra-plugin-anonymize-ua) plugin, which need to be installed as well:

```bash
yarn add puppeteer-extra-plugin-stealth puppeteer-extra-plugin-anonymize-ua
# - or -
npm install puppeteer-extra-plugin-stealth puppeteer-extra-plugin-anonymize-ua
```

If you'd like to see debug output just run your script like so:

```bash
DEBUG=puppeteer-extra,puppeteer-extra-plugin:* node myscript.js
```

## Plugins

#### 🆕 [`puppeteer-extra-plugin-recaptcha`](/packages/puppeteer-extra-plugin-recaptcha)

- Solves reCAPTCHAs automatically, using a single line of code: `page.solveRecaptchas()`.

#### 🔥 [`puppeteer-extra-plugin-stealth`](/packages/puppeteer-extra-plugin-stealth)

- Applies various evasion techniques to make detection of headless puppeteer harder.

#### [`puppeteer-extra-plugin-devtools`](/packages/puppeteer-extra-plugin-devtools)

- Makes puppeteer browser debugging possible from anywhere.
- Creates a secure tunnel to make the devtools frontend (**incl. screencasting**) accessible from the public internet

#### [`puppeteer-extra-plugin-repl`](/packages/puppeteer-extra-plugin-repl)

- Makes quick puppeteer debugging and exploration fun with an interactive REPL.

#### [`puppeteer-extra-plugin-block-resources`](/packages/puppeteer-extra-plugin-block-resources)

- Blocks resources (images, media, css, etc.) in puppeteer.
- Supports all resource types, blocking can be toggled dynamically.

#### [`puppeteer-extra-plugin-flash`](/packages/puppeteer-extra-plugin-flash)

- Allows flash content to run on all sites without user interaction.

#### [`puppeteer-extra-plugin-anonymize-ua`](/packages/puppeteer-extra-plugin-anonymize-ua)

- Anonymizes the user-agent on all pages.
- Supports dynamic replacing, so the browser version stays intact and recent.

#### [`puppeteer-extra-plugin-user-preferences`](/packages/puppeteer-extra-plugin-user-preferences)

- Allows setting custom Chrome/Chromium user preferences.
- Has itself a plugin interface which is used by e.g. [`puppeteer-extra-plugin-font-size`](/packages/puppeteer-extra-plugin-font-size).

> Check out the [packages folder](/packages/) for more plugins.

## Contributing

PRs and new plugins are welcome! :tada: The plugin API for `puppeteer-extra` is clean and fun to use. Have a look the [PuppeteerExtraPlugin](/packages/puppeteer-extra-plugin) base class documentation to get going and check out the [existing plugins](./packages/) (minimal example is the [anonymize-ua](/packages/puppeteer-extra-plugin-anonymize-ua/index.js) plugin) for reference.

We use a [monorepo](/) powered by [Lerna](https://github.com/lerna/lerna#--use-workspaces) (and yarn workspaces), [ava](https://github.com/avajs/ava) for testing, the [standard](https://standardjs.com/) style for linting and [JSDoc](http://usejsdoc.org/about-getting-started.html) heavily to [auto-generate](https://github.com/transitive-bullshit/update-markdown-jsdoc) markdown [documentation](https://github.com/documentationjs/documentation) based on code. :-)

### Kudos

- Thanks to [skyiea](https://github.com/skyiea) for [this PR](https://github.com/GoogleChrome/puppeteer/pull/1806) that started the project idea.
- Thanks to [transitive-bullshit](https://github.com/transitive-bullshit) for [suggesting](https://github.com/berstend/puppeteer-extra/issues/2) a modular plugin design, which was fun to implement.

## Compatibility

`puppeteer-extra` and all plugins are [tested continously](https://travis-ci.org/berstend/puppeteer-extra) against all relevant NodeJS (v8-v13) and puppeteer versions.
We never broke compatibility and still support puppeteer down to version 1.6.2 (Released Aug 1, 2018).

A few plugins won't work in headless mode (it's noted if that's the case) due to Chrome limitations (e.g. the [`user-preferences`](/packages/puppeteer-extra-plugin-user-preferences) plugin), look into `xvfb-run` if you still require a headless experience in these circumstances.

---

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

- [PuppeteerExtra](#puppeteerextra)
  - [use](#use)
  - [launch](#launch)
  - [connect](#connect)
  - [plugins](#plugins)
  - [getPluginData](#getplugindata)
  - [executablePath](#executablepath)
  - [defaultArgs](#defaultargs)
  - [createBrowserFetcher](#createbrowserfetcher)

### [PuppeteerExtra](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L43-L391)

Modular plugin framework to teach `puppeteer` new tricks.

This module acts a drop-in replacement for `puppeteer`.

Allows PuppeteerExtraPlugin's to register themselves and
to extend puppeteer with additional functionality.

Type: `function ()`

Example:

```javascript
const puppeteer = require('puppeteer-extra')
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
puppeteer.use(
  require('puppeteer-extra-plugin-font-size')({ defaultFontSize: 18 })
)
;(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('http://example.com', { waitUntil: 'domcontentloaded' })
  await browser.close()
})()
```

---

#### [use](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L63-L79)

Outside interface to register plugins.

Type: `function (plugin): this`

- `plugin` **PuppeteerExtraPlugin**

Example:

```javascript
const puppeteer = require('puppeteer-extra')
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
puppeteer.use(require('puppeteer-extra-plugin-user-preferences')())
const browser = await puppeteer.launch(...)
```

---

#### [launch](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L94-L113)

Launch a new browser instance with given arguments.

Augments the original `puppeteer.launch` method with plugin lifecycle methods.

All registered plugins that have a `beforeLaunch` method will be called
in sequence to potentially update the `options` Object before launching the browser.

Type: `function (options): Puppeteer.Browser`

- `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** Regular [Puppeteer launch options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions) (optional, default `{}`)

---

#### [connect](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L126-L144)

Attach Puppeteer to an existing Chromium instance.

Augments the original `puppeteer.connect` method with plugin lifecycle methods.

All registered plugins that have a `beforeConnect` method will be called
in sequence to potentially update the `options` Object before launching the browser.

Type: `function (options)`

- `options` **{browserWSEndpoint: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), ignoreHTTPSErrors: [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)}** (optional, default `{}`)

---

#### [plugins](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L187-L187)

Get all registered plugins.

Type: [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;PuppeteerExtraPlugin>

---

#### [getPluginData](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L209-L214)

- **See: puppeteer-extra-plugin/data**

Collects the exposed `data` property of all registered plugins.
Will be reduced/flattened to a single array.

Can be accessed by plugins that listed the `dataFromPlugins` requirement.

Implemented mainly for plugins that need data from other plugins (e.g. `user-preferences`).

Type: `function (name)`

- `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Filter data by name property (optional, default `null`)

---

#### [executablePath](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L369-L371)

Regular Puppeteer method that is being passed through.

Type: `function (): string`

---

#### [defaultArgs](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L378-L380)

Regular Puppeteer method that is being passed through.

Type: `function ()`

---

#### [createBrowserFetcher](https://github.com/berstend/puppeteer-extra/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra/index.js#L388-L390)

Regular Puppeteer method that is being passed through.

Type: `function (options): PuppeteerBrowserFetcher`

- `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?**

---
