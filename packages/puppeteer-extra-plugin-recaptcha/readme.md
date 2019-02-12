# puppeteer-extra-plugin-recaptcha [![Build Status](https://travis-ci.org/berstend/puppeteer-extra.svg?branch=master)](https://travis-ci.org/berstend/puppeteer-extra) [![npm](https://img.shields.io/npm/v/puppeteer-extra-plugin-recaptcha.svg)](https://www.npmjs.com/package/puppeteer-extra-plugin-recaptcha)

> A [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugin to solve reCAPTCHAs automatically.

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

## Usage

The plugin essentially provides a mighty `page.solveRecaptchas()` method that does everything needed automagically.

```js
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add recaptcha plugin and provide it your 2captcha token
// 2captcha is the builtin solution provider but others work as well.
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
puppeteer.use(
  RecaptchaPlugin({
    provider: { id: '2captcha', token: 'XXXXXXX' },
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

_**Tip:** The recaptcha plugin works really well together with the [stealth plugin](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth)._

## Motivation 🏴

These days [captchas](https://en.wikipedia.org/wiki/CAPTCHA) are unfortunately everywhere, with [reCAPTCHA](https://developers.google.com/recaptcha/) having the biggest "market share" in that space (> 80%). The situation got really bad, with privacy minded users (tracking blocker, VPNs) being penalized heavily and having to solve a lot of reCAPTCHA challenges constantly while browsing the web.

The stated reasons for this omnipresent captcha plague vary from site owners having to protect themselves against increasingly malicious actors to some believing that we're essentially forced into free labour to train Google's various machine learning endeavours.

In any case I strongly feel that captchas in their current form have failed. They're a much bigger obstacle and annoyance to humans than to robots, which renders them useless. My anarchist contribution to this discussion is to demonstrate this absurdity, with a plugin for robots with which **a single line of code is all it takes to bypass reCAPTCHAs on any site**.

## Provider

I thought about having the plugin solve captchas directly (e.g. using the [audio challenge](https://github.com/dessant/buster) and speech-to-text APIs), but external solution providers are so cheap and reliable that there is really no benefit in doing that. ¯\\\_(ツ)\_/¯

### 2captcha

Currently the only builtin solution provider as it's the cheapest and most reliable, from my experience. If you'd like to throw some free captcha credit my way feel free to [signup here](https://2captcha.com?from=6690177) (affiliate link).

- Cost: 1000 reCAPTCHAs for 3 USD
- Delay: Solving a reCAPTCHA takes between 10 to 60 seconds
- Error rate (incorrect solutions): Very rare

#### Other providers

You can easily use your own provider as well, by providing the plugin a function instead of 2captcha credentials (explained in the API docs). PRs for new providers are welcome as well.

## Q&A

### How does this work?

- When summoned with `page.solveRecaptchas()` the plugin will attempt to find any visible reCAPTCHAs, extract their configuration, pass that on to the specified solutions provider, take the solutions and put them back into the page (triggering any callback that might be required).

### How do reCAPTCHAs work?

- reCAPTCHAs use a per-site `sitekey`. Interestingly enough the response token after solving a challenge is (currently) not tied to a specific session or IP and can be passed on to others (until they expire). This is how the external solutions provider work: They're being given a `sitekey` and URL, solve the challenge and respond with a response token.

- This plugin automates all these steps in a generic way (detecting captchas, extracting their config and `sitekey`) as well as triggering the (optional) response callback the site owner might have specified.

### Are ordinary image captchas supported as well?

- No. This plugin focusses on reCAPTCHAs exclusively, with the benefit of being fully automatic. 🔮

### What about invisible reCAPTCHAs?

- [Invisible reCAPTCHAs](https://developers.google.com/recaptcha/docs/invisible) are a different beast. They're basically used to compute a score of how likely the user is a bot. Based on that score the site owner can block access to resources or (most often) present the user with a reCAPTCHA challenge. The [stealth plugin](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) might be of interest here, as it masks the usage of puppeteer.

### When should I call `page.solveRecaptchas()`?

- reCAPTCHAs will be solved automatically whenever they **are visible** (_aka their "I'm not a robot" iframe in the DOM_). It's your responsibility to do any required actions to trigger the captcha being shown, if needed.
- If you summon the plugin immediately after navigating to a page it's got your back and will wait automatically until the reCAPTCHA script (if any) has been loaded and initialized.
- If you call `page.solveRecaptchas()` on a page that has no reCAPTCHAs nothing bad will happen (😄) but the promise will resolve resolve and the rest of your code executes as normal.
- After solving the reCAPTCHAs the plugin will automatically detect and trigger their [optional callback](https://developers.google.com/recaptcha/docs/display#render_param). This might result in forms being submitted and page navigations to occur, depending on how the site owner implemented the reCAPTCHA.

## Debug

```bash
DEBUG=puppeteer-extra,puppeteer-extra-plugin:* node myscript.js
```

## Fine grained control

### Defaults

By default the plugin will never throw, but return any errors silently in the `{ error }` property of the result object. You can change that behaviour by passing `throwOnError: true` to the initializier and use `try/catch` blocks to catch errors.

For convenience and because it looks cool the plugin will "colorize" reCAPTCHAs depending on their state (violet = detected and being solved, green = solved). You can turn that feature off by passing `visualFeedback: false` to the plugin initializer.

### Result object

```js
const { captchas, solutions, solved, error } = await page.solveRecaptchas()
```

- `captchas` is an array of captchas found in the page
- `solutions` is an array of solutions returned from the provider
- `solved` is an array of "solved" (= solution entered) captchas on the page

### Manual control flow

`page.solveRecaptchas()` is a convenience method that wraps the following steps:

```js
let { captchas, error } = await page.findRecaptchas()
let { solutions, error } = await page.getRecaptchaSolutions(captchas)
let { solved, error } = await page.enterRecaptchaSolutions(solutions)
```

## API

I'm currently reimplementing autogenerated API docs using typedoc (instead of jsdoc/documentation.js). Docs will be updated soon.

## Todo

- Trigger the captcha checkbox first and only use an external provider when presented with a challenge (we might get lucky and save a few cents).
