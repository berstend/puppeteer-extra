# puppeteer-extra [![GitHub Workflow Status](https://img.shields.io/github/workflow/status/berstend/puppeteer-extra/Test/master)](https://github.com/berstend/puppeteer-extra/actions) [![Discord](https://img.shields.io/discord/737009125862408274)](http://scraping-chat.cf) [![npm](https://img.shields.io/npm/v/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra) [![npm](https://img.shields.io/npm/dt/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra) [![npm](https://img.shields.io/npm/l/puppeteer-extra.svg)](https://www.npmjs.com/package/puppeteer-extra)

> A light-weight wrapper around [`puppeteer`](https://github.com/GoogleChrome/puppeteer) and [friends](#more-examples) to enable cool [plugins](#plugins) through a clean interface.

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

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

// That's it, the rest is puppeteer usage as normal 😊
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })

  console.log(`Testing adblocker plugin..`)
  await page.goto('https://www.vanityfair.com')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'adblocker.png', fullPage: true })

  console.log(`Testing the stealth plugin..`)
  await page.goto('https://bot.sannysoft.com')
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'stealth.png', fullPage: true })

  console.log(`All done, check the screenshots. ✨`)
  await browser.close()
})
```

The above example uses the [`stealth`](/packages/puppeteer-extra-plugin-stealth) and [`adblocker`](/packages/puppeteer-extra-plugin-adblocker) plugin, which need to be installed as well:

```bash
yarn add puppeteer-extra-plugin-stealth puppeteer-extra-plugin-adblocker
# - or -
npm install puppeteer-extra-plugin-stealth puppeteer-extra-plugin-adblocker
```

If you'd like to see debug output just run your script like so:

```bash
DEBUG=puppeteer-extra,puppeteer-extra-plugin:* node myscript.js
```

### More examples

<details>
 <summary><strong>TypeScript usage</strong></summary><br/>

**NOTE: `puppeteer` broke typings in recent versions, please install `puppeteer@5` for the time being (see [here](https://github.com/berstend/puppeteer-extra/issues/428#issuecomment-778679665) for more info).**

> `puppeteer-extra` and most plugins are written in TS,
> so you get perfect type support out of the box. :)

```ts
import puppeteer from 'puppeteer-extra'

import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(AdblockerPlugin()).use(StealthPlugin())

puppeteer
  .launch({ headless: false, defaultViewport: null })
  .then(async browser => {
    const page = await browser.newPage()
    await page.goto('https://bot.sannysoft.com')
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'stealth.png', fullPage: true })
    await browser.close()
  })
```

> Please check this [wiki](https://github.com/berstend/puppeteer-extra/wiki/TypeScript-usage) entry in case you have TypeScript related import issues.

![typings](https://i.imgur.com/bNtuTOt.png 'Typings')

</details>

<details>
 <summary><strong>Multiple puppeteers with different plugins</strong></summary><br/>

```js
const vanillaPuppeteer = require('puppeteer')

const { addExtra } = require('puppeteer-extra')
const AnonymizeUA = require('puppeteer-extra-plugin-anonymize-ua')

async function main() {
  const pptr1 = addExtra(vanillaPuppeteer)
  pptr1.use(
    AnonymizeUA({
      customFn: ua => 'Hello1/' + ua.replace('Chrome', 'Beer')
    })
  )

  const pptr2 = addExtra(vanillaPuppeteer)
  pptr2.use(
    AnonymizeUA({
      customFn: ua => 'Hello2/' + ua.replace('Chrome', 'Beer')
    })
  )

  await checkUserAgent(pptr1)
  await checkUserAgent(pptr2)
}

main()

async function checkUserAgent(pptr) {
  const browser = await pptr.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('https://httpbin.org/headers', {
    waitUntil: 'domcontentloaded'
  })
  const content = await page.content()
  console.log(content)
  await browser.close()
}
```

</details>

<details>
 <summary><strong>Using with <code>puppeteer-firefox</code></strong></summary><br/>

> [puppeteer-firefox](https://github.com/puppeteer/puppeteer/tree/master/experimental/puppeteer-firefox) is still new and experimental, you can follow it's progress [here](https://aslushnikov.github.io/ispuppeteerfirefoxready/).

```js
// Any puppeteer API-compatible puppeteer implementation
// or version can be augmented with `addExtra`.
const { addExtra } = require('puppeteer-extra')
const puppeteer = addExtra(require('puppeteer-firefox'))

puppeteer
  .launch({ headless: false, defaultViewport: null })
  .then(async browser => {
    const page = await browser.newPage()
    await page.goto('https://www.spacejam.com/archive/spacejam/movie/jam.htm')
    await page.waitForTimeout(10 * 1000)
    await browser.close()
  })
```

</details>

<details>
 <summary><strong>Using with <code>puppeteer-cluster</code></strong></summary><br/>

> [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster) allows you to create a cluster of puppeteer workers and plays well together with `puppeteer-extra`.

```js
const { Cluster } = require('puppeteer-cluster')
const vanillaPuppeteer = require('puppeteer')

const { addExtra } = require('puppeteer-extra')
const Stealth = require('puppeteer-extra-plugin-stealth')
const Recaptcha = require('puppeteer-extra-plugin-recaptcha')

async function main() {
  // Create a custom puppeteer-extra instance using `addExtra`,
  // so we could create additional ones with different plugin config.
  const puppeteer = addExtra(vanillaPuppeteer)
  puppeteer.use(Stealth())
  puppeteer.use(Recaptcha())

  // Launch cluster with puppeteer-extra
  const cluster = await Cluster.launch({
    puppeteer,
    maxConcurrency: 2,
    concurrency: Cluster.CONCURRENCY_CONTEXT
  })

  // Define task handler
  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url)

    const { hostname } = new URL(url)
    const { captchas } = await page.findRecaptchas()
    console.log(`Found ${captchas.length} captcha on ${hostname}`)

    await page.screenshot({ path: `${hostname}.png`, fullPage: true })
  })

  // Queue any number of tasks
  cluster.queue('https://bot.sannysoft.com')
  cluster.queue('https://www.google.com/recaptcha/api2/demo')
  cluster.queue('http://www.wikipedia.org/')

  await cluster.idle()
  await cluster.close()
  console.log(`All done, check the screenshots. ✨`)
}

// Let's go
main().catch(console.warn)
```

For using with TypeScript, just change your imports to:

```ts
import { Cluster } from 'puppeteer-cluster'
import vanillaPuppeteer from 'puppeteer'

import { addExtra } from 'puppeteer-extra'
import Stealth from 'puppeteer-extra-plugin-stealth'
import Recaptcha from 'puppeteer-extra-plugin-recaptcha'
```

</details>

<details>
 <summary><strong>Using with <code>chrome-aws-lambda</code></strong></summary><br/>

> If you plan to use [chrome-aws-lambda](https://github.com/alixaxel/chrome-aws-lambda) with the [`stealth`](/packages/puppeteer-extra-plugin-stealth) plugin, you'll need to modify the default args to remove the
> `--disable-notifications` flag to pass all the tests.

```js
const chromium = require('chrome-aws-lambda')
const { addExtra } = require('puppeteer-extra')
const puppeteerExtra = addExtra(chromium.puppeteer)

const launch = async () => {
  puppeteerExtra
    .launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    })
    .then(async browser => {
      const page = await browser.newPage()
      await page.goto('https://www.spacejam.com/archive/spacejam/movie/jam.htm')
      await page.waitForTimeout(10 * 1000)
      await browser.close()
    })
}

launch() // Launch Browser
```

</details>

<details>
 <summary><strong>Using with <code>Kikobeats/browserless</code></strong></summary><br/>

> [Kikobeats/browserless](https://github.com/Kikobeats/browserless) is a puppeteer-like Node.js library for interacting with Headless production scenarios.

```js
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const browserless = require('browserless')({ puppeteer })

const saveBufferToFile = (buffer, fileName) => {
  const wstream = require('fs').createWriteStream(fileName)
  wstream.write(buffer)
  wstream.end()
}

browserless
  .screenshot('https://bot.sannysoft.com', { device: 'iPhone 6' })
  .then(buffer => {
    const fileName = 'screenshot.png'
    saveBufferToFile(buffer, fileName)
    console.log(`your screenshot is here: `, fileName)
  })
```

</details>

---

## Plugins

#### 🔥 [`puppeteer-extra-plugin-stealth`](/packages/puppeteer-extra-plugin-stealth)

- Applies various evasion techniques to make detection of headless puppeteer harder.

#### 🆕 [`puppeteer-extra-plugin-adblocker`](/packages/puppeteer-extra-plugin-adblocker)

- Very fast & efficient blocker for ads and trackers. Reduces bandwidth & load times.
- Thanks to [@remusao](https://github.com/remusao) for contributing this plugin 👏

#### 🏴 [`puppeteer-extra-plugin-recaptcha`](/packages/puppeteer-extra-plugin-recaptcha)

- Solves reCAPTCHAs automatically, using a single line of code: `page.solveRecaptchas()`.

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

### Community Plugins

_These plugins have been generously contributed by members of the community._
_Please note that they're hosted outside the main project and not under our control or supervision._

#### [`puppeteer-extra-plugin-minmax`](https://github.com/Stillerman/puppeteer-extra-minmax)

- Minimize and maximize puppeteer in real time.
- Great for manually solving captchas.

> Please check the `Contributing` section below if you're interested in creating a plugin as well.

---

## Contributors

<a href="https://github.com/berstend/puppeteer-extra/graphs/contributors">
  <img src="https://contributors-img.firebaseapp.com/image?repo=berstend/puppeteer-extra" />
</a>

## Further info

<details>
 <summary><strong>Contributing</strong></summary><br/>

PRs and new plugins are welcome! 🎉 The plugin API for `puppeteer-extra` is clean and fun to use. Have a look the [PuppeteerExtraPlugin](/packages/puppeteer-extra-plugin) base class documentation to get going and check out the [existing plugins](./packages/) (minimal example is the [anonymize-ua](/packages/puppeteer-extra-plugin-anonymize-ua/index.js) plugin) for reference.

We use a [monorepo](/) powered by [Lerna](https://github.com/lerna/lerna#--use-workspaces) (and yarn workspaces), [ava](https://github.com/avajs/ava) for testing, TypeScript for the core, the [standard](https://standardjs.com/) style for linting and [JSDoc](http://usejsdoc.org/about-getting-started.html) heavily to auto-generate markdown [documentation](https://github.com/documentationjs/documentation) based on code. :-)

</details>

<details>
 <summary><strong>Kudos</strong></summary><br/>

- Thanks to [skyiea](https://github.com/skyiea) for [this PR](https://github.com/GoogleChrome/puppeteer/pull/1806) that started the project idea.
- Thanks to [transitive-bullshit](https://github.com/transitive-bullshit) for [suggesting](https://github.com/berstend/puppeteer-extra/issues/2) a modular plugin design, which was fun to implement.

</details>

<details>
 <summary><strong>Compatibility</strong></summary><br/>

`puppeteer-extra` and all plugins are [tested continously](https://github.com/berstend/puppeteer-extra/actions) in a matrix of current (stable & LTS) NodeJS and puppeteer versions.
We never broke compatibility and still support puppeteer down to very early versions from 2018.

A few plugins won't work in headless mode (it's noted if that's the case) due to Chrome limitations (e.g. the [`user-preferences`](/packages/puppeteer-extra-plugin-user-preferences) plugin), look into `xvfb-run` if you still require a headless experience in these circumstances.

</details>

## Changelog

<details>
 <summary><code>2.1.6 ➠ 3.1.1</code></summary>

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

### class: [PuppeteerExtra](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L67-L474)

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

#### .[use(plugin)](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L85-L107)

- `plugin` **PuppeteerExtraPlugin**

Returns: **this** The same `PuppeteerExtra` instance (for optional chaining)

The **main interface** to register `puppeteer-extra` plugins.

Example:

```javascript
puppeteer.use(plugin1).use(plugin2)
```

- **See: [PuppeteerExtraPlugin]**

---

#### .[launch(options?)](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L153-L177)

- `options` **Puppeteer.LaunchOptions?** See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).

Returns: **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;Puppeteer.Browser>**

The method launches a browser instance with given arguments. The browser will be closed when the parent node.js process is closed.

Augments the original `puppeteer.launch` method with plugin lifecycle methods.

All registered plugins that have a `beforeLaunch` method will be called
in sequence to potentially update the `options` Object before launching the browser.

Example:

```javascript
const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null
})
```

---

#### .[connect(options?)](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L189-L208)

- `options` **Puppeteer.ConnectOptions?** See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerconnectoptions).

Returns: **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;Puppeteer.Browser>**

Attach Puppeteer to an existing Chromium instance.

Augments the original `puppeteer.connect` method with plugin lifecycle methods.

All registered plugins that have a `beforeConnect` method will be called
in sequence to potentially update the `options` Object before launching the browser.

---

#### .[defaultArgs(options?)](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L215-L217)

- `options` **Puppeteer.ChromeArgOptions?** See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerdefaultargsoptions).

Returns: **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**

The default flags that Chromium will be launched with.

---

#### .[executablePath()](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L220-L222)

Returns: **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**

Path where Puppeteer expects to find bundled Chromium.

---

#### .[createBrowserFetcher(options?)](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L229-L233)

- `options` **Puppeteer.FetcherOptions?** See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteercreatebrowserfetcheroptions).

Returns: **Puppeteer.BrowserFetcher**

This methods attaches Puppeteer to an existing Chromium instance.

---

#### .[plugins](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L283-L285)

Type: **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;PuppeteerExtraPlugin>**

Get a list of all registered plugins.

---

#### .[getPluginData(name?)](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L310-L315)

- `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Filter data by optional plugin name

Collects the exposed `data` property of all registered plugins.
Will be reduced/flattened to a single array.

Can be accessed by plugins that listed the `dataFromPlugins` requirement.

Implemented mainly for plugins that need data from other plugins (e.g. `user-preferences`).

- **See: [PuppeteerExtraPlugin]/data**

---

### [defaultExport()](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L494-L496)

Type: **[PuppeteerExtra](#puppeteerextra)**

The **default export** will behave exactly the same as the regular puppeteer
(just with extra plugin functionality) and can be used as a drop-in replacement.

Behind the scenes it will try to require either `puppeteer`
or [`puppeteer-core`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteer-vs-puppeteer-core)
from the installed dependencies.

Example:

```javascript
// javascript import
const puppeteer = require('puppeteer-extra')

// typescript/es6 module import
import puppeteer from 'puppeteer-extra'

// Add plugins
puppeteer.use(...)
```

---

### [addExtra(puppeteer)](https://github.com/berstend/puppeteer-extra/blob/dc8b90260a927c0c66c4585c5a56092ea9c35049/packages/puppeteer-extra/src/index.ts#L519-L520)

- `puppeteer` **VanillaPuppeteer** Any puppeteer API-compatible puppeteer implementation or version.

Returns: **[PuppeteerExtra](#puppeteerextra)** A fresh PuppeteerExtra instance using the provided puppeteer

An **alternative way** to use `puppeteer-extra`: Augments the provided puppeteer with extra plugin functionality.

This is useful in case you need multiple puppeteer instances with different plugins or to add plugins to a non-standard puppeteer package.

Example:

```javascript
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

Copyright © 2018 - 2021, [berstend̡̲̫̹̠̖͚͓̔̄̓̐̄͛̀͘](mailto:github@berstend.com?subject=[GitHub]%20PuppeteerExtra). Released under the MIT License.

<!-- Markdown footnotes (for links) -->

[puppeteerextraplugin]: https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin 'PuppeteerExtraPlugin Documentation'
