# puppeteer-extra [![Build Status](https://travis-ci.org/berstend/puppeteer-extra.svg?branch=master)](https://travis-ci.org/berstend/puppeteer-extra) [![npm](https://img.shields.io/npm/v/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra) [![npm](https://img.shields.io/npm/dt/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra) [![npm](https://img.shields.io/npm/l/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra)

> A light-weight wrapper around [`puppeteer`](https://github.com/GoogleChrome/puppeteer) to enable cool [plugins](#plugins) through a clean interface.

<a href="https://github.com/berstend/puppeteer-extra"><img src="https://i.imgur.com/qtlnoQL.png" width="279px" height="187px" align="right" /></a>

## Installation

```bash
yarn add puppeteer puppeteer-extra
# - or -
npm install puppeteer puppeteer-extra

# puppeteer-extra works with any puppeteer version:
yarn add puppeteer@2.0.0 puppeteer-extra
```

## Quickstart

```js
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

### More examples

<details>
 <summary><strong>TypeScript usage</strong></summary>

```ts
import puppeteer from 'puppeteer-extra'

import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(RecaptchaPlugin()).use(StealthPlugin())

puppeteer.launch({ headless: false }).then(async browser => {
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })

  await page.goto('https://bot.sannysoft.com')
  await page.waitFor(5000)
  await page.screenshot({ path: 'stealth.png', fullPage: true })

  await browser.close()
})
```

![typings](https://i.imgur.com/bNtuTOt.png 'Typings')

</details>

<details>
 <summary><strong>Firefox usage</strong></summary>

```js
const { addExtra } = require('puppeteer-extra')
const puppeteer = addExtra(require('puppeteer-firefox'))

puppeteer.launch({ headless: false }).then(async browser => {
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })

  await page.goto('https://www.spacejam.com/archive/spacejam/movie/jam.htm')
  await page.waitFor(10 * 1000)

  await browser.close()
})
```

</details>

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

## Further info

<details>
 <summary><strong>Contributing</strong></summary>

PRs and new plugins are welcome! 🎉 The plugin API for `puppeteer-extra` is clean and fun to use. Have a look the [PuppeteerExtraPlugin](/packages/puppeteer-extra-plugin) base class documentation to get going and check out the [existing plugins](./packages/) (minimal example is the [anonymize-ua](/packages/puppeteer-extra-plugin-anonymize-ua/index.js) plugin) for reference.

We use a [monorepo](/) powered by [Lerna](https://github.com/lerna/lerna#--use-workspaces) (and yarn workspaces), [ava](https://github.com/avajs/ava) for testing, TypeScript for the core, the [standard](https://standardjs.com/) style for linting and [JSDoc](http://usejsdoc.org/about-getting-started.html) heavily to auto-generate markdown [documentation](https://github.com/documentationjs/documentation) based on code. :-)

</details>

<details>
 <summary><strong>Kudos</strong></summary>

- Thanks to [skyiea](https://github.com/skyiea) for [this PR](https://github.com/GoogleChrome/puppeteer/pull/1806) that started the project idea.
- Thanks to [transitive-bullshit](https://github.com/transitive-bullshit) for [suggesting](https://github.com/berstend/puppeteer-extra/issues/2) a modular plugin design, which was fun to implement.

</details>

<details>
 <summary><strong>Compatibility</strong></summary>

`puppeteer-extra` and all plugins are [tested continously](https://travis-ci.org/berstend/puppeteer-extra) against all relevant NodeJS (v8-v13) and puppeteer versions.
We never broke compatibility and still support puppeteer down to version 1.6.2 (Released Aug 1, 2018).

A few plugins won't work in headless mode (it's noted if that's the case) due to Chrome limitations (e.g. the [`user-preferences`](/packages/puppeteer-extra-plugin-user-preferences) plugin), look into `xvfb-run` if you still require a headless experience in these circumstances.

</details>

<details>
 <summary><strong>Changelog</strong></summary>

### `2.1.6` ➠ `3.1.1`

Big refactor, the core is now **written in TypeScript** 🎉
That means out of the box type safety for fellow TS users and nice auto-completion in VSCode for JS users. Also:

- A new [`addExtra`](#addextrapuppeteer) export, to **patch any puppeteer compatible library with plugin functionality** (`puppeteer-firefox`, `chrome-aws-lambda`, etc). This also allows for multiple puppeteer instances with different plugins.

The API is backwards compatible, I bumped the major version just in case I missed something. Please report any issues you might find with the new release. :)

</details>

---

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

- [class: PuppeteerExtra](#class-puppeteerextra)
  - [.use(plugin)](#useplugin)
  - [.launch(options?)](#launchoptions)
  - [.connect(options?)](#connectoptions)
  - [.defaultArgs(options?)](#defaultargsoptions)
  - [.executablePath()](#executablepath)
  - [.createBrowserFetcher(options?)](#createbrowserfetcheroptions)
  - [.plugins](#plugins)
  - [.getPluginData(name?)](#getplugindataname)
- [defaultExport()](#defaultexport)
- [addExtra(puppeteer)](#addextrapuppeteer)

### class: [PuppeteerExtra](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L67-L463)

Modular plugin framework to teach `puppeteer` new tricks.

This module acts as a drop-in replacement for `puppeteer`.

Allows PuppeteerExtraPlugin's to register themselves and
to extend puppeteer with additional functionality.

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

#### .[use(plugin)](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L80-L102)

- `plugin` **PuppeteerExtraPlugin**

Returns: **this** The same `PuppeteerExtra` instance (for optional chaining)

The **main interface** to register `puppeteer-extra` plugins.

---

#### .[launch(options?)](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L142-L166)

- `options` **Puppeteer.LaunchOptions?** See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).

Returns: **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;Puppeteer.Browser>**

The method launches a browser instance with given arguments. The browser will be closed when the parent node.js process is closed.

Augments the original `puppeteer.launch` method with plugin lifecycle methods.

All registered plugins that have a `beforeLaunch` method will be called
in sequence to potentially update the `options` Object before launching the browser.

---

#### .[connect(options?)](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L178-L197)

- `options` **Puppeteer.ConnectOptions?** See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerconnectoptions).

Returns: **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;Puppeteer.Browser>**

Attach Puppeteer to an existing Chromium instance.

Augments the original `puppeteer.connect` method with plugin lifecycle methods.

All registered plugins that have a `beforeConnect` method will be called
in sequence to potentially update the `options` Object before launching the browser.

---

#### .[defaultArgs(options?)](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L204-L206)

- `options` **Puppeteer.ChromeArgOptions?** See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerdefaultargsoptions).

Returns: **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**

The default flags that Chromium will be launched with.

---

#### .[executablePath()](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L209-L211)

Returns: **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**

Path where Puppeteer expects to find bundled Chromium.

---

#### .[createBrowserFetcher(options?)](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L218-L222)

- `options` **Puppeteer.FetcherOptions?** See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteercreatebrowserfetcheroptions).

Returns: **Puppeteer.BrowserFetcher**

This methods attaches Puppeteer to an existing Chromium instance.

---

#### .[plugins](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L272-L274)

Type: **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;PuppeteerExtraPlugin>**

Get all registered plugins.

---

#### .[getPluginData(name?)](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L299-L304)

- `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Filter data by optional plugin name

Collects the exposed `data` property of all registered plugins.
Will be reduced/flattened to a single array.

Can be accessed by plugins that listed the `dataFromPlugins` requirement.

Implemented mainly for plugins that need data from other plugins (e.g. `user-preferences`).

- **See: puppeteer-extra-plugin/data**

---

### [defaultExport()](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L484-L486)

Type: **[PuppeteerExtra](#puppeteerextra)**

The **default export** will behave exactly the same as the regular puppeteer
(just with extra plugin functionality) and can be used as a drop-in replacement.

Behind the scenes it will try to require either `puppeteer`
or [`puppeteer-core`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteer-vs-puppeteer-core)
from the installed dependencies.

```js
// javascript import
const puppeteer = require('puppeteer-extra')

// typescript/es6 module import
import puppeteer from 'puppeteer-extra'

// Add plugins
puppeteer.use(...)
```

---

### [addExtra(puppeteer)](https://github.com/berstend/puppeteer-extra/blob/790777a5d72ef5d0c2be01baf8fdc594a41af96a/packages/puppeteer-extra/src/index.ts#L509-L510)

- `puppeteer` **VanillaPuppeteer** Any puppeteer API-compatible puppeteer implementation or version.

Returns: **[PuppeteerExtra](#puppeteerextra)** A fresh PuppeteerExtra instance using the provided puppeteer

An **alternative way** to use `puppeteer-extra`: Augments the provided puppeteer with extra plugin functionality.

This is useful in case you need multiple puppeteer instances with different plugins or to add plugins to a non-standard puppeteer package.

```js
// js import
const { addExtra } = require('puppeteer-extra')

// ts/es6 import
import { addExtra } from 'puppeteer-extra'

// Patch e.g. puppeteer-firefox and add plugins
const puppeteer = addExtra(require('puppeteer-firefox'))
puppeteer.use(...)
```

---

## License

Copyright © 2019, [berstend̡̲̫̹̠̖͚͓̔̄̓̐̄͛̀͘](mailto:github@berstend.com?subject=[GitHub]%20PuppeteerExtra). Released under the MIT License.
