# playwright-extra [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/berstend/puppeteer-extra/test.yml?branch=master&event=push)](https://github.com/berstend/puppeteer-extra/actions) [![Discord](https://img.shields.io/discord/737009125862408274)](https://extra.community) [![npm](https://img.shields.io/npm/v/playwright-extra.svg)](https://www.npmjs.com/package/playwright-extra)

> A modular plugin framework for [playwright](https://github.com/microsoft/playwright) to enable cool [plugins](#plugins) through a clean interface.

## Installation

```bash
yarn add playwright playwright-extra
# - or -
npm install playwright playwright-extra
```

<details>
 <summary>Changelog</summary>

> Please check the `announcements` channel in our [discord server](https://extra.community) until we've automated readme updates. :)

- **v4.3**
  - Rerelease due to versioning issues with previous beta packages
- **v3.3**
  - Initial public release
  </details>

## Quickstart

```js
// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
const { chromium } = require('playwright-extra')

// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
const stealth = require('puppeteer-extra-plugin-stealth')()

// Add the plugin to playwright (any number of plugins can be added)
chromium.use(stealth)

// That's it, the rest is playwright usage as normal 😊
chromium.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()

  console.log('Testing the stealth plugin..')
  await page.goto('https://bot.sannysoft.com', { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'stealth.png', fullPage: true })

  console.log('All done, check the screenshot. ✨')
  await browser.close()
})
```

The above example uses the compatible [`stealth`](/packages/puppeteer-extra-plugin-stealth) plugin from puppeteer-extra, that plugin needs to be installed as well:

```bash
yarn add puppeteer-extra-plugin-stealth
# - or -
npm install puppeteer-extra-plugin-stealth
```

If you'd like to see debug output just run your script like so:

```bash
# macOS/Linux (Bash)
DEBUG=playwright-extra*,puppeteer-extra* node myscript.js

# Windows (Powershell)
$env:DEBUG='playwright-extra*,puppeteer-extra*';node myscript.js
```

### More examples

<details>
 <summary><strong>TypeScript & ESM usage</strong></summary><br/>

`playwright-extra` and most plugins are written in TS, so you get perfect type support out of the box. :)

```ts
// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
import { chromium } from 'playwright-extra'

// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// Add the plugin to playwright (any number of plugins can be added)
chromium.use(StealthPlugin())

// ...(the rest of the quickstart code example is the same)
chromium.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()

  console.log('Testing the stealth plugin..')
  await page.goto('https://bot.sannysoft.com', { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'stealth.png', fullPage: true })

  console.log('All done, check the screenshot. ✨')
  await browser.close()
})
```

New to Typescript? Here it is in 30 seconds or less 😄:

```bash
# Optional: If you don't have yarn yet
npm i --global yarn

# Optional: Create new package.json if it's a new project
yarn init -y

# Add basic typescript dependencies
yarn add --dev typescript @types/node esbuild esbuild-register

# Bootstrap a tsconfig.json
yarn tsc --init --target ES2020 --lib ES2020 --module commonjs --rootDir src --outDir dist

# Add dependencies used in the quick start example
yarn add playwright playwright-extra puppeteer-extra-plugin-stealth

# Create source folder for the .ts files
mkdir src

# Now place the example code above in `src/index.ts`

# Run the typescript code without the need of compiling it first
node -r esbuild-register src/index.ts

# You can now add Typescript to your CV 🎉
```

</details>
<details>
 <summary><strong>Using different browsers</strong></summary><br/>

```ts
// Any browser supported by playwright can be used with plugins
import { chromium, firefox, webkit } from 'playwright-extra'

chromium.use(plugin)
firefox.use(plugin)
webkit.use(plugin)
```

</details>
<details>
 <summary><strong>Multiple instances with different plugins</strong></summary><br/>

Node.js imports are cached, therefore the default `chromium`, `firefox`, `webkit` export from `playwright-extra` will always return the same playwright instance.

```ts
// Use `addExtra` to create a fresh and independent instance
import playwright from 'playwright'
import { addExtra } from 'playwright-extra'

const chromium1 = addExtra(playwright.chromium)
const chromium2 = addExtra(playwright.chromium)

chromium1.use(onePlugin)
chromium2.use(anotherPlugin)
// chromium1 and chromium2 are independent
```

</details>

---

## Plugins

We're currently in the process of making the existing [puppeteer-extra](/packages/puppeteer-extra) plugins compatible with playwright-extra, the following plugins have been successfully tested already:

### 🔥 [`puppeteer-extra-plugin-stealth`](/packages/puppeteer-extra-plugin-stealth)

- Applies various evasion techniques to make detection of an automated browser harder
- Compatible with Puppeteer & Playwright and chromium based browsers

<details>
<summary>&nbsp;&nbsp;Example: Using stealth in Playwright with custom options</summary>

```js
// The stealth plugin is optimized for chromium based browsers currently
import { chromium } from 'playwright-extra'

import StealthPlugin from 'puppeteer-extra-plugin-stealth'
chromium.use(StealthPlugin())

// New way to overwrite the default options of stealth evasion plugins
// https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth/evasions
chromium.plugins.setDependencyDefaults('stealth/evasions/webgl.vendor', {
  vendor: 'Bob',
  renderer: 'Alice'
})

// That's it, the rest is playwright usage as normal 😊
chromium.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()

  console.log('Testing the webgl spoofing feature of the stealth plugin..')
  await page.goto('https://webglreport.com', { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'webgl.png', fullPage: true })

  console.log('All done, check the screenshot. ✨')
  await browser.close()
})
```

</details>

### 🏴 [`puppeteer-extra-plugin-recaptcha`](/packages/puppeteer-extra-plugin-recaptcha)

- Solves reCAPTCHAs and hCaptchas automatically, using a single line of code: `page.solveRecaptchas()`
- Compatible with Puppeteer & Playwright and all browsers (chromium, firefox, webkit)
<details>
<summary>&nbsp;&nbsp;Example: Solving captchas in Playwright & Firefox</summary>

```js
// Any browser (chromium, webkit, firefox) can be used
import { firefox } from 'playwright-extra'

import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'
firefox.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN || 'YOUR_API_KEY'
    }
  })
)

// Works in headless as well, just so you can see it in action
firefox.launch({ headless: false }).then(async browser => {
  const context = await browser.newContext()
  const page = await context.newPage()
  const url = 'https://www.google.com/recaptcha/api2/demo'
  await page.goto(url, { waitUntil: 'networkidle' })

  console.log('Solving captchas..')
  await page.solveRecaptchas()

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click(`#recaptcha-demo-submit`)
  ])

  const content = await page.content()
  const isSuccess = content.includes('Verification Success')
  console.log('Done', { isSuccess })
  await browser.close()
})
```

</details>

### 🆕 [`plugin-proxy-router`](/packages/plugin-proxy-router)

- Use multiple proxies dynamically with flexible per-host routing and more
- Compatible with Puppeteer & Playwright and all browsers (chromium, firefox, webkit)

**Notes**

- If you're in need of adblocking use [this package](https://www.npmjs.com/package/@cliqz/adblocker-playwright) or [block resources natively](https://github.com/berstend/puppeteer-extra/wiki/Block-resources-without-request-interception)
- We're focussing on compatiblity with existing plugins at the moment, more documentation on how to write your own playwright-extra plugins will follow

---

## Contributors

<a href="https://github.com/berstend/puppeteer-extra/graphs/contributors">
  <img src="https://contributors-img.firebaseapp.com/image?repo=berstend/puppeteer-extra" />
</a>

---

## License

Copyright © 2018 - 2023, [berstend̡̲̫̹̠̖͚͓̔̄̓̐̄͛̀͘](https://github.com/berstend). Released under the MIT License.

<!--
  Reference links
-->

[playwright-extra]: https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra
[puppeteer-extra]: https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra
[`puppeteer-extra`]: https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra
