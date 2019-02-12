# puppeteer-extra-plugin-stealth [![Build Status](https://travis-ci.org/berstend/puppeteer-extra.svg?branch=master)](https://travis-ci.org/berstend/puppeteer-extra) [![npm](https://img.shields.io/npm/v/puppeteer-extra-plugin-stealth.svg)](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth)

> A plugin for [puppeteer-extra](https://github.com/berstend/puppeteer-extra) to prevent detection.

### Install

```bash
yarn add puppeteer-extra-plugin-stealth
# - or -
npm install puppeteer-extra-plugin-stealth
```

If this is your first [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugin here's everything you need:

```bash
yarn add puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
# - or -
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

### Usage

```js
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require("puppeteer-extra")

// add stealth plugin and use defaults (all evasion techniques)
const pluginStealth = require("puppeteer-extra-plugin-stealth")
puppeteer.use(pluginStealth())

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })
  await page.goto("https://bot.sannysoft.com")
  await page.waitFor(5000)
  await page.screenshot({ path: "testresult.png", fullPage: true })
  await browser.close()
})
```

## Changelog

### `v2.1.2`

- Improved: `navigator.plugins` - we fully emulate plugins/mimetypes in headless now 🎉
- New: `webgl.vendor` - is otherwise set to "Google" in headless
- New: `window.outerdimensions` - fix missing window.outerWidth/outerHeight and viewport
- Fixed: `navigator.webdriver` now returns undefined instead of false

## Test results (red is bad)

#### Vanilla puppeteer <strong>without stealth 😢</strong>

<table class="image">
<tr>

  <td><figure class="image"><a href="./stealthtests/_results/headless-chromium-vanilla.js.png"><img src="./stealthtests/_results/_thumbs/headless-chromium-vanilla.js.png"></a><figcaption>Chromium + headless</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headful-chromium-vanilla.js.png"><img src="./stealthtests/_results/_thumbs/headful-chromium-vanilla.js.png"></a><figcaption>Chromium + headful</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headless-chrome-vanilla.js.png"><img src="./stealthtests/_results/_thumbs/headless-chrome-vanilla.js.png"></a><figcaption>Chrome + headless</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headful-chrome-vanilla.js.png"><img src="./stealthtests/_results/_thumbs/headful-chrome-vanilla.js.png"></a><figcaption>Chrome + headful</figcaption></figure></td>

</tr>
</table>

#### Puppeteer <strong>with stealth plugin 💯</strong>

<table class="image">
<tr>

  <td><figure class="image"><a href="./stealthtests/_results/headless-chromium-stealth.js.png"><img src="./stealthtests/_results/_thumbs/headless-chromium-stealth.js.png"></a><figcaption>Chromium + headless</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headful-chromium-stealth.js.png"><img src="./stealthtests/_results/_thumbs/headful-chromium-stealth.js.png"></a><figcaption>Chromium + headful</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headless-chrome-stealth.js.png"><img src="./stealthtests/_results/_thumbs/headless-chrome-stealth.js.png"></a><figcaption>Chrome + headless</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headful-chrome-stealth.js.png"><img src="./stealthtests/_results/_thumbs/headful-chrome-stealth.js.png"></a><figcaption>Chrome + headful</figcaption></figure></td>

</tr>
</table>

Tests have been done using [this test site](https://bot.sannysoft.com/) and [these scripts](./stealthtests/).

#### Improved reCAPTCHA v3 scores

Using stealth also seems to help with maintaining a normal [reCAPTCHA v3 score](https://developers.google.com/recaptcha/docs/v3#score).

<table class="image">
<tr>

  <td><figure class="image"><figcaption><code>Regular Puppeteer</code></figcaption><br/><img src="https://i.imgur.com/rHEH69b.png"></figure></td>
  <td><figure class="image"><figcaption><code>Stealth Puppeteer</code></figcaption><br/><img src="https://i.imgur.com/2if496Z.png"></figure></td>

</tr>
</table>

Note: The [official test](https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php) is to be taken with a grain of salt, as the score is calculated individually per site and multiple other factors (past behaviour, IP address, etc). Based on anecdotal observations it still seems to work as a rough indicator.

_**Tip:** Have a look at the [recaptcha plugin](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-recaptcha) if you have issues with reCAPTCHAs._

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

- [Plugin](#plugin)
  - [Purpose](#purpose)
  - [Modularity](#modularity)
  - [Contributing](#contributing)
  - [Kudos](#kudos)
  - [availableEvasions](#availableevasions)
  - [enabledEvasions](#enabledevasions)

### [Plugin](https://git@github.com/:berstend/puppeteer-extra/blob/ff112879545e8e68d6500d731ceeafc22d187dd3/packages/puppeteer-extra-plugin-stealth/index.js#L72-L151)

**Extends: PuppeteerExtraPlugin**

Stealth mode: Applies various techniques to make detection of headless puppeteer harder. 💯

#### Purpose

There are a couple of ways the use of puppeteer can easily be detected by a target website.
The addition of `HeadlessChrome` to the user-agent being only the most obvious one.

The goal of this plugin is to be the definite companion to puppeteer to avoid
detection, applying new techniques as they surface.

As this cat & mouse game is in it's infancy and fast-paced the plugin
is kept as flexibile as possible, to support quick testing and iterations.

#### Modularity

This plugin uses `puppeteer-extra`'s dependency system to only require
code mods for evasions that have been enabled, to keep things modular and efficient.

The `stealth` plugin is a convenience wrapper that requires multiple [evasion techniques](./evasions/)
automatically and comes with defaults. You could also bypass the main module and require
specific evasion plugins yourself, if you whish to do so (as they're standalone `puppeteer-extra` plugins):

```es6
// bypass main module and require a specific stealth plugin directly:
puppeteer.use(
  require("puppeteer-extra-plugin-stealth/evasions/console.debug")()
)
```

#### Contributing

PRs are welcome, if you want to add a new evasion technique I suggest you
look at the [template](./evasions/_template) to kickstart things.

#### Kudos

Thanks to [Evan Sangaline](https://intoli.com/blog/not-possible-to-block-chrome-headless/) and [Paul Irish](https://github.com/paulirish/headless-cat-n-mouse) for kickstarting the discussion!

---

Type: `function (opts)`

- `opts` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Options (optional, default `{}`)
  - `opts.enabledEvasions` **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>?** Specify which evasions to use (by default all)

Example:

```javascript
const puppeteer = require("puppeteer-extra")
// Enable stealth plugin with all evasions
puppeteer.use(require("puppeteer-extra-plugin-stealth")())
;(async () => {
  // Launch the browser in headless mode and set up a page.
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true
  })
  const page = await browser.newPage()

  // Navigate to the page that will perform the tests.
  const testUrl =
    "https://intoli.com/blog/" +
    "not-possible-to-block-chrome-headless/chrome-headless-test.html"
  await page.goto(testUrl)

  // Save a screenshot of the results.
  const screenshotPath = "/tmp/headless-test-result.png"
  await page.screenshot({ path: screenshotPath })
  console.log("have a look at the screenshot:", screenshotPath)

  await browser.close()
})()
```

---

#### [availableEvasions](https://git@github.com/:berstend/puppeteer-extra/blob/ff112879545e8e68d6500d731ceeafc22d187dd3/packages/puppeteer-extra-plugin-stealth/index.js#L124-L126)

Get all available evasions.

Please look into the [evasions directory](./evasions/) for an up to date list.

Type: [Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>

Example:

```javascript
const pluginStealth = require("puppeteer-extra-plugin-stealth")()
console.log(pluginStealth.availableEvasions) // => Set { 'user-agent', 'console.debug' }
puppeteer.use(pluginStealth)
```

---

#### [enabledEvasions](https://git@github.com/:berstend/puppeteer-extra/blob/ff112879545e8e68d6500d731ceeafc22d187dd3/packages/puppeteer-extra-plugin-stealth/index.js#L141-L143)

Get all enabled evasions.

Enabled evasions can be configured either through `opts` or by modifying this property.

Type: [Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>

Example:

```javascript
// Remove specific evasion from enabled ones dynamically
const pluginStealth = require("puppeteer-extra-plugin-stealth")()
pluginStealth.enabledEvasions.delete("console.debug")
puppeteer.use(pluginStealth)
```

---
