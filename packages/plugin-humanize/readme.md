# @extra/humanize [![GitHub Workflow Status](https://img.shields.io/github/workflow/status/berstend/puppeteer-extra/Test/master)](https://github.com/berstend/puppeteer-extra/actions) [![Discord](https://img.shields.io/discord/737009125862408274)](http://scraping-chat.cf) [![npm](https://img.shields.io/npm/v/@extra/humanize.svg)](https://www.npmjs.com/package/@extra/humanize)

> A plugin for [playwright-extra] & [puppeteer-extra] to humanize input (mouse movements, etc)

![ghost-cursor in action](https://cdn.discordapp.com/attachments/418699380833648644/664110683054538772/acc_gen.gif)

## Install
> ⚡ **This is not publicly released yet:** [Please read this for beta version installation instructions](https://github.com/berstend/puppeteer-extra/issues/454).

```bash
yarn add @extra/humanize
# - or -
npm install @extra/humanize
```

<details>
 <summary>Changelog</summary>

- v4
  - Initial public release

</details>

## Support

| 💫                            | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](#)<br/>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](#)<br/>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Webkit" width="24px" height="24px" />](#)<br/>Webkit |
| ----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| **[Playwright](#Playwright)** |                                                                               ✅                                                                               |                                                                                 ✅                                                                                 |                                                                               ✅                                                                               |
| **[Puppeteer](#Puppeteer)**   |                                                                               ✅                                                                               |                                      [🕒](https://github.com/berstend/puppeteer-extra/wiki/Is-Puppeteer-Firefox-ready-yet%3F)                                      |                                                                               -                                                                                |

> Learn more at [Playwright vs Puppeteer](https://github.com/berstend/puppeteer-extra/wiki/Playwright-vs-Puppeteer)

## Usage

The plugin augments APIs like `page.click()` to use realistic human input behavior behind the scenes.

### Playwright

If this is your first [playwright-extra] plugin here's everything you need:

```bash
yarn add playwright playwright-extra @extra/humanize
# - or -
npm install playwright playwright-extra @extra/humanize
```

```js
// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
// Note: Instead of firefox you can use chromium and webkit as well.
const { firefox } = require('playwright-extra')

// Add humanize plugin
const HumanizePlugin = require('@extra/humanize')
firefox.use(
  HumanizePlugin({
    mouse: {
      showCursor: true // Show the cursor (meant for testing)
    }
  })
)

// playwright usage as normal
firefox.launch({ headless: false }).then(async browser => {
  const page = await browser.newPage()
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('a')

  // This regular API will automatically be humanized 🎉
  await page.click('a')

  await page.waitForTimeout(5 * 1000)
  await browser.close()
})
```

### Puppeteer

If this is your first [puppeteer-extra] plugin here's everything you need:

```bash
yarn add puppeteer puppeteer-extra @extra/humanize
# - or -
npm install puppeteer puppeteer-extra @extra/humanize
```

The code is basically the same as in the playwright example :-)
Just use this import instead:

```js
const puppeteer = require('puppeteer-extra')
// (...)
puppeteer.launch()
// (...)
```

<details>
 <summary><strong>TypeScript usage</strong></summary>

> The plugin framework as well as this plugin are written in TS, hence you get perfect type support out of the box :)

</details><br>

If you'd like to see debug output just run your script like so:

```bash
DEBUG=automation-extra,automation-extra-plugin:* node myscript.js
```

## Human robots

This plugin is heavily based on the work of @Xetera and @Niek with [ghost-cursor](https://github.com/Xetera/ghost-cursor). It's using generated bezier curves to mimic and spoof realistic human mouse movements while navigating a site and clicking on elements.

### Current features

- Augments `page.click()` with human like mouse movements (move cursor to the element and click it)
- Supports Playwright & Puppeteer and all browsers
- Can be enabled/disabled on the fly with `plugin.disable()` and `plugin.enable()`

### Plugin Options

```ts
export interface MouseOpts {
  /** Enable human mouse movements when clicking */
  enabled: boolean // default: true
  /** Show a visible cursor (for testing, not for production) */
  showCursor: boolean // default: false
}

export interface HumanizePluginOpts {
  mouse: Partial<MouseOpts>
}
```

### Todo

(This plugin can be considered in beta stage)

- Mouse movements
  - Playwright: Improve frame support
  - Playwright: Support random starting point
  - Use and implement native ClickOptions (delay and the like)
  - More mouse options (waitForElement, etc)
  - Consider augmenting `elementHandle.click()` as well
- Keyboard/typing
  - Add human typing behavior (random delays, backspace probability, etc)
- General
  - More documentation
  - Generate API docs
  - Code cleanup
  - Expose more options and configurations

---

## License

Copyright © 2018 - 2021, [berstend̡̲̫̹̠̖͚͓̔̄̓̐̄͛̀͘](https://github.com/berstend). Released under the MIT License.

<!--
  Reference links
-->

[playwright-extra]: https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra
[puppeteer-extra]: https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra
