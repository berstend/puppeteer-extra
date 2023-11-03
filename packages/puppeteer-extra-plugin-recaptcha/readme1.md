# puppeteer-extra-plugin-recaptcha [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/berstend/puppeteer-extra/test.yml?branch=master&event=push) [![Discord](https://img.shields.io/discord/737009125862408274)](https://extra.community) [![npm](https://img.shields.io/npm/dt/puppeteer-extra-plugin-recaptcha.svg)](https://www.npmjs.com/package/puppeteer-extra-plugin-recaptcha) [![npm](https://img.shields.io/npm/v/puppeteer-extra-plugin-recaptcha.svg)](https://www.npmjs.com/package/puppeteer-extra-plugin-recaptcha)

> A [puppeteer-extra](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra) and [playwright-extra](https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra) plugin to solve reCAPTCHAs and hCaptchas automatically.

![](https://i.imgur.com/SWrIQw0.gif)

## Install

```bash
yarn add puppeteer-extra-plugin-recaptcha
# - or -
npm install puppeteer-extra-plugin-recaptcha
```

If this is your first [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugin here's everything you need:

```bash
yarn add puppeteer puppeteer-extra puppeteer-extra-plugin-recaptcha
# - or -
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-recaptcha
```

<details>
 <summary><strong>Changelog</strong></summary>

##### Latest

> 🎁 **Note:** Until we've automated changelog updates in markdown files please follow the `#announcements` channel in our [discord server](https://extra.community/) for the latest updates and changelog info.

_Older changelog:_

##### `3.1.9`

- Support reCAPTCHAs not in forms ([#57](https://github.com/berstend/puppeteer-extra/issues/57))
- Make script detection more fuzzy ([#48](https://github.com/berstend/puppeteer-extra/issues/48))

##### `3.1.6`

- We'll now add our custom methods to any existing pages and frames in the browser instance.
- Fixed reference import path for our ambient declarations.

##### `3.1.5`

- Solving reCAPTCHAs in frames is now supported as well, if need be:

```js
for (const frame of page.mainFrame().childFrames()) {
  await frame.solveRecaptchas()
}
```

##### `3.1.4`

- Improved TypeScript experience: I found a way to make your TypeScript compiler automatically aware of the additions to the `Page` and `Frame` object (e.g. `page.solveRecaptchas()`).
- We now print a warning if the provider throws an error (e.g. invalid api key)

</details>

## Usage

The plugin essentially provides a mighty `page.solveRecaptchas()` method that does everything needed automagically.

```js
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add recaptcha plugin and provide it your 2captcha token (= their apiKey)
// 2captcha is the builtin solution provider but others would work as well.
// Please note: You need to add funds to your 2captcha account for this to work
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: 'XXXXXXX' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
)

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()
  await page.goto('https://www.google.com/recaptcha/api2/demo')

  // That's it, a single line of code to solve reCAPTCHAs 🎉
  await page.solveRecaptchas()

  await Promise.all([
    page.waitForNavigation(),
    page.click(`#recaptcha-demo-submit`)
  ])
  await page.screenshot({ path: 'response.png', fullPage: true })
  await browser.close()
})
```

<details>
 <summary><strong>TypeScript usage</strong></summary>

```ts
// `puppeteer-extra` and the recaptcha plugin are written in TS,
// hence you get perfect type support out of the box :)

import puppeteer from 'puppeteer-extra'
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: 'ENTER_YOUR_2CAPTCHA_API_KEY_HERE'
    }
  })
)

// Puppeteer usage as normal (headless is "false" just for this demo)
puppeteer.launch({ headless: false }).then(async browser => {
  const page = await browser.newPage()
  await page.goto('https://www.google.com/recaptcha/api2/demo')

  // Even this `Puppeteer.Page` extension is recognized and fully type safe 🎉
  await page.solveRecaptchas()

  await Promise.all([
    page.waitForNavigation(),
    page.click(`#recaptcha-demo-submit`)
  ])
  await page.screenshot({ path: 'response.png', fullPage: true })
  await browser.close()
})
```

</details><br>

If you'd like to see debug output just run your script like so:

```bash
DEBUG=puppeteer-extra,puppeteer-extra-plugin:* node myscript.js
```

_**Tip:** The recaptcha plugin works really well together with the [stealth plugin](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth)._

## Motivation 🏴

These days [captchas](https://en.wikipedia.org/wiki/CAPTCHA) are unfortunately everywhere, with [reCAPTCHA](https://developers.google.com/recaptcha/) having the biggest "market share" in that space (> 80%). The situation got really bad, with privacy minded users (tracking blocker, VPNs) being penalized heavily and having to solve a lot of reCAPTCHA challenges constantly while browsing the web.

The stated reasons for this omnipresent captcha plague vary from site owners having to protect themselves against increasingly malicious actors to some believing that we're essentially forced into free labour to train Google's various machine learning endeavours.

In any case I strongly feel that captchas in their current form have failed. They're a much bigger obstacle and annoyance to humans than to robots, which renders them useless. My anarchist contribution to this discussion is to demonstrate this absurdity, with a plugin for robots with which **a single line of code is all it takes to bypass reCAPTCHAs on any site**.

> Note: Since `v3.3.0` the plugin will solve [hCaptchas](https://www.hcaptcha.com/) as well, as they've gained significant marketshare through their Cloudflare partnership.

## Provider

I thought about having the plugin solve captchas directly (e.g. using the [audio challenge](https://github.com/dessant/buster) and speech-to-text APIs), but external solution providers are so cheap and reliable that there is really no benefit in doing that. ¯\\\_(ツ)\_/¯

_Please note:_ You need a provider configured for this plugin to do it's magic. If you decide to use the built-in 2captcha provider you need to add funds to your 2captcha account.

### 2captcha

Currently the only builtin solution provider as it's the cheapest and most reliable, from my experience. If you'd like to throw some free captcha credit my way feel free to [signup here](https://2captcha.com?from=6690177) (referral link, allows me to write automated tests against their API).

- Cost: 1000 reCAPTCHAs (and hCaptchas) for 3 USD
- Delay: Solving a reCAPTCHA takes between 10 to 60 seconds
- Error rate (incorrect solutions): Very rare

#### Other providers

You can easily use your own provider as well, by providing the plugin a function instead of 2captcha credentials (explained in the API docs). PRs for new providers are welcome as well.

## Q&A

### How does this work?

- When summoned with `page.solveRecaptchas()` the plugin will attempt to find any active reCAPTCHAs & hCaptchas, extract their configuration, pass that on to the specified solutions provider, take the solutions and put them back into the page (triggering any callback that might be required).

### Is this production ready?

- Yes, the plugin is actively maintained, has been battle-hardened over several years and is used in high workload production setups.

### How do reCAPTCHAs work?

- reCAPTCHAs use a per-site `sitekey`. Interestingly enough the response token after solving a challenge is (currently) not tied to a specific session or IP and can be passed on to others (until they expire). This is how the external solutions provider work: They're being given a `sitekey` and URL, solve the challenge and respond with a response token.

- This plugin automates all these steps in a generic and robust way (detecting captchas, extracting their config and `sitekey`) as well as triggering the (optional) response callback the site owner might have specified.

### Are ordinary image captchas supported as well?

- No. This plugin focusses on reCAPTCHAs and hCaptchas exclusively, with the benefit of being fully automatic. 🔮

### What about invisible reCAPTCHAs?

- [Invisible reCAPTCHAs](https://developers.google.com/recaptcha/docs/invisible) are supported. They're basically used to compute a score of how likely the user is a bot. Based on that score the site owner can block access to resources or (most often) present the user with a reCAPTCHA challenge (which this plugin can solve). The [stealth plugin](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) might be of interest here, as it masks the usage of puppeteer.
- Technically speaking the plugin supports: reCAPTCHA v2, reCAPTCHA v3, invisible reCAPTCHA, hCaptcha, invisible hCaptcha. All of those (multiple as well) are solved when `page.solveRecaptchas()` is called.

### When should I call `page.solveRecaptchas()`?

- reCAPTCHAs will be solved automatically whenever they **are visible** (_aka their "I'm not a robot" iframe in the DOM_). It's your responsibility to do any required actions to trigger the captcha being shown, if needed.
  - Note about "invisible" versions of reCAPTCHA/hCaptchas: They don't feature a visible checkbox iframe, the plugin will then solve any open challenge popups instead. :-)
- If you summon the plugin immediately after navigating to a page it's got your back and will wait automatically until the reCAPTCHA script (if any) has been loaded and initialized.
- If you call `page.solveRecaptchas()` on a page that has no reCAPTCHAs nothing bad will happen (😄) but the promise will resolve and the rest of your code executes as normal.
- After solving the reCAPTCHAs the plugin will automatically detect and trigger their [optional callback](https://developers.google.com/recaptcha/docs/display#render_param). This might result in forms being submitted and page navigations to occur, depending on how the site owner implemented the reCAPTCHA.

## Debug

```bash
DEBUG=puppeteer-extra,puppeteer-extra-plugin:* node myscript.js
```

## Fine grained control

### Defaults

By default the plugin will never throw, but return any errors silently in the `{ error }` property of the result object. You can change that behaviour by passing `throwOnError: true` to the initializier and use `try/catch` blocks to catch errors.

For convenience and because it looks cool the plugin will "colorize" reCAPTCHAs depending on their state (violet = detected and being solved, green = solved). You can turn that feature off by passing `visualFeedback: false` to the plugin initializer.

### Options

```ts
interface PluginOptions {
  /** Visualize reCAPTCHAs based on their state */
  visualFeedback: boolean // default: true
  /** Throw on errors instead of returning them in the error property */
  throwOnError: boolean // default: false
  /** Only solve captchas and challenges visible in the browser viewport */
  solveInViewportOnly: boolean // default: false
  /** Solve scored based captchas with no challenge (e.g. reCAPTCHA v3) */
  solveScoreBased: boolean // default: false
  /** Solve invisible captchas that have no active challenge */
  solveInactiveChallenges: boolean // default: false
}
```

### Result object

```js
const {
  captchas,
  filtered,
  solutions,
  solved,
  error
} = await page.solveRecaptchas()
```

- `captchas` is an array of captchas found in the page
- `filtered` is an array of captchas that have been detected but are ignored due to plugin options
- `solutions` is an array of solutions returned from the provider
- `solved` is an array of "solved" (= solution entered) captchas on the page

### Manual control flow

`page.solveRecaptchas()` is a convenience method that wraps the following steps:

```js
let { captchas, filtered, error } = await page.findRecaptchas()
let { solutions, error } = await page.getRecaptchaSolutions(captchas)
let { solved, error } = await page.enterRecaptchaSolutions(solutions)
```

### Proxies

If you wish for 2captcha to use a specific proxy (= IP address) while solving the captcha you can set the enviroment variables `2CAPTCHA_PROXY_TYPE` and `2CAPTCHA_PROXY_ADDRESS`.

## Troubleshooting

### Solving captchas in iframes

By default the plugin will only solve reCAPTCHAs showing up on the immediate page. In case you encounter captchas in frames the plugin extends the `Puppeteer.Frame` object with custom methods as well:

```js
// Loop over all potential frames on that page
for (const frame of page.mainFrame().childFrames()) {
  // Attempt to solve any potential captchas in those frames
  await frame.solveRecaptchas()
}
```

In addition you might want to disable site isolation, so puppeteer is able to access [cross-origin iframes](https://github.com/puppeteer/puppeteer/issues/2548):

```js
puppeteer.launch({
  args: [
    '--disable-features=IsolateOrigins,site-per-process,SitePerProcess',
    '--flag-switches-begin --disable-site-isolation-trials --flag-switches-end'
  ]
})
```

### Solving captchas in pre-existing browser pages

In case you're not using `browser.newPage()` but re-use the existing `about:blank` tab (which is not recommended for various reasons) you will experience a `page.solveRecaptchas is not a function` error, as the plugin hasn't hooked into this page yet. As a workaround you can manually add existing pages to the lifecycle methods of the plugin:

```js
const recaptcha = RecaptchaPlugin()
const pages = await browser.pages()
for (const page in pages) {
  // Add plugin methods to existing pages
  await recaptcha.onPageCreated(page)
}
```

### Tips

- Make sure to use debug logging if something is not working right or when reporting issues.
- Check for ignored captchas in the filtered array in case a captcha you intend to solve is being ignored, filtered captchas will state the reason why they have been ignored (or better: which plugin option is responsible)
- Keep in mind that by default the plugin will only solve "active" captchas (the means a visible checkbox or an active challenge popup). In extreme cases (like a very weird or super slow loading site) you can help the plugin by making sure the captcha you intend to solve is there before calling `page.solveRecaptchas`:

```js
await page.waitForSelector('iframe[src*="recaptcha/"]')
await page.solveRecaptchas()
```

---

## License

Copyright © 2018 - 2023, [berstend̡̲̫̹̠̖͚͓̔̄̓̐̄͛̀͘](https://github.com/berstend). Released under the MIT License.
