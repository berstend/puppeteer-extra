# puppeteer-extra


![](https://i.imgur.com/2ZjXBe5.jpg)

> A light-weight wrapper around [`puppeteer`](https://github.com/GoogleChrome/puppeteer) to handle more advanced use-cases, most notably the abillity to set custom user preferences, a stealth mode and to allow flash content without confirmation prompts.


## Installation

```bash
yarn add puppeteer puppeteer-extra
# Note: You need to install the puppeteer dependency yourself.
# This allows you to specify a specific version if needed.
```


## Quickstart

```es6
const PuppeteerExtra = require('puppeteer-extra');

(async () => {
  const puppeteer = new PuppeteerExtra()
  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()
  await page.goto("http://httpbin.org/headers", {waitUntil: "domcontentloaded"})
  await browser.close();
})()
```


## Example


```es6
// puppeteer-extra lists puppeteer as peerDependency,
// which means it'll use the version you've installed yourself
const PuppeteerExtra = require("./lib/PuppeteerExtra");

(async () => {
  // Instantiate puppeteer-extra
  const puppeteer = new PuppeteerExtra()

  // Change default font size to 22px using custom user preferences
  puppeteer.setUserPreferences({
    webkit: {
      webprefs: {
        default_font_size: 22,
      },
    },
  })

  // Enable more extras: stealth mode and allow flash everywhere
  puppeteer.setExtras({stealth: true, allowFlash: true})

  // When using the built-in chromium browser we need to define our own pepper flash plugin path and version
  // You can skip this step when using a regular Chrome (using `options.executablePath`)
  puppeteer.setFlashSettings(
    "/Users/demo/Library/Application Support/Google/Chrome/PepperFlash/29.0.0.171/PepperFlashPlayer.plugin",
    "29.0.0.171"
  )

  // Regular puppeteer options
  const options = {
    args: ['--no-sandbox'],
    headless: false,
  }

  // Normal puppeteer code
  const browser = await puppeteer.launch(options)
  const page = await browser.newPage()

  // Test flash
  await page.goto("http://ultrasounds.com/", {waitUntil: "domcontentloaded"})

  // Test stealth
  await page.goto("https://intoli.com/blog/not-possible-to-block-chrome-headless/chrome-headless-test.html", {waitUntil: "domcontentloaded"})

  // New helper function, click on an element and wait until navigation occured
  await page.goto("https://intoli.com/blog/not-possible-to-block-chrome-headless", {waitUntil: "domcontentloaded"})
  await page.clickAndWaitForNavigation(".navbar-brand.home")
  await browser.close();
})()
```

## Reference

`puppeteer-extra` exposes all regular [Puppeteer APIs](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) and adds a couple of additional ones.

### class: Puppeteer


#### puppeteer.setExtras(extras)
- `extras` <[Object]> Set of configurable extras. Can have the following fields:
  - `stealth` <[boolean]> Whether to enable [stealth mode](#stealthmode). Defaults to `false`.
  - `allowFlash` <[boolean]> Allow [flash content](#flash) to run on all sites without confirmation prompts. Defaults to `false`
  - `keepTemporaryUserDataDir` <[boolean]> Keep the temporary user data directory after the code has finished. Defaults to `false`.


#### puppeteer.setUserPreferences(prefs)
- `prefs` <[Object]>

Add preferences that will be written to the `Default/Preferences` file in the (temporary) user data directory.



#### puppeteer.setFlashSettings(path, version)
- `path` <[string]>
- `version` <[string]> Defaults to `9000` (high enough so chrome won't complain about flash being outdated)

Used in conjunction with `puppeteer.setExtras({allowFlash: true})`. Only required when using (the built-in) Chromium browser, as pepper flash isn't bundled with it. [See here](http://chromium.woolyss.com/#flash) about how to obtain that plugin for various platforms. 

Not necessary when using a regular Google Chrome, e.g.:

```es6
const options = {
  headless: false,
  executablePath: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
}
const browser = await puppeteer.launch(options)
```



### class: Page

#### page.clickAndWaitForNavigation(selector, clickOptions, waitOptions)

Convenience function to wait for navigation to complete after clicking on an element. See [this issue](https://github.com/GoogleChrome/puppeteer/issues/1421) for more details.




## Notes

### Motivation

The pupeeteer team is doing a great job but unfortunately decided to not include certain features, as they would create feature disparity between the headless and headful mode. Most notably support for legacy flash plugins and custom user preferences. As a fork would require too much time to maintain, `puppeteer-extra` is a small wrapper that augments puppeteer with certain additional methods.


### Headless

Unfortunately the headless puppeteer implementation differs quite a bit from the normal one. Custom preferences sometimes require `chrome` settings, which haven't been implemented in headless puppeteer. Due to this it's required to use these extra settings with `headless: false`. Look into `xvfb-run` if you still require a headless experience.


### Stealth mode

There are a couple of ways the use of puppeteer can easily be detected by a target website. The addition of `HeadlessChrome` to the user-agent being the most obvious one. Based on [this blog article](https://intoli.com/blog/not-possible-to-block-chrome-headless/) and [this repo](https://github.com/paulirish/headless-cat-n-mouse) `puppeteer-extra` applies various techniques to make detection harder.

`puppeteer.setExtras({stealth: true})`


### User Preferences

`puppeteer-extra` allows you to set custom user preferences. These will be written to the `Preferences` file in a temporary (unless provided) userDataDir before launching the browser instance.

In order to inspect your own preferences navigate to `chrome://version/` and look into the `Preferences` file in the stated Profile Path.

[List of all preferences](https://chromium.googlesource.com/chromium/src/+/master/chrome/common/pref_names.cc)



### Flash

Using flash with puppeteer in latest Chrome browsers is quite problematic, it requires manual confirmation to be run that cannot be scripted (system dialogs). After some tinkering I've found realiable `Preferences` settings to whitelist and enable flash by default for all sites, without any required user interaction. :-)

`puppeteer.setExtras({allowFlash: true})`

Note: `headless: false` is required.

Note: When using the bundled chromium browser you need to additionally define the flash plugin path.




## Todo

Pull requests are welcome, if you have something that could be useful for others and that won't be added to `puppeteer` then this project might a good fit for it. :-)

* Hygiene: Add tests
* Collect more user preference examples
* Convenience wrappers:
  * disableWebRTC
  * disableGeolocation
  * disableBrowserDialogs
* Figure out how to enable chrome://flags features
* Add support for chrome extensions


## Contributors

Thanks to @skyiea for [this PR](https://github.com/GoogleChrome/puppeteer/pull/1806)!
