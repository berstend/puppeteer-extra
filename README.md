# puppeteer-extra 
[![npm](https://img.shields.io/npm/v/puppeteer-extra.svg?style=flat-square)](https://www.npmjs.com/package/puppeteer-extra) 
[![npm](https://img.shields.io/npm/dt/puppeteer-extra.svg?style=flat-square)](https://www.npmjs.com/package/puppeteer-extra) 
[![npm](https://img.shields.io/npm/l/puppeteer-extra.svg?style=flat-square)](https://www.npmjs.com/package/puppeteer-extra)
![David](https://img.shields.io/david/berstend/puppeteer-extra.svg?style=flat-square)


[![extra](https://i.imgur.com/2ZjXBe5.jpg)](https://github.com/berstend/puppeteer-extra)

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
const PuppeteerExtra = require('puppeteer-extra');

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
  - `stealth` <[boolean]> Whether to enable [stealth mode](#stealth-mode). Defaults to `false`.
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

#### puppeteer.addExtensions(paths)
- `paths` <[string]|[Array]<[string]>> - A single path to an unpacked [Chrome Extension](#extensions) or an array containing multiple extensions


### class: Browser

#### browser.getExtensions()
- returns: <[Promise]<?[Array]>> Promise which resolves to an array of Objects containing information about the currently loaded [Chrome Extensions](#extensions).

As part of an extension object being returned the `.evaluate()` function can be used to run arbitrary code in the context of the extensions background page and to receive the return value.





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


### Extensions

`puppeteer-extra` ships with a couple of convenience functions to make working with (local, unpacked) Chrome Extensions a bit more convenient.

`puppeteer.addExtensions()` can be used to add one or more extensions to the browser, and `browser.getExtensions()` allows enumerating loaded extensions after startup.

As part of an extension object being returned the `.evaluate()` function can be used to run arbitrary code in the context of the extensions background page and to receive the return value.

A full example [can be found here](examples/extensions.js).




## Todo

Pull requests are welcome, if you have something that could be useful for others and that won't be added to `puppeteer` then this project might a good fit for it. :-)

* Hygiene: Add tests
* Add more examples for different use-cases
* Collect more user preference examples
* Convenience wrappers:
  * disableWebRTC
  * disableGeolocation
  * disableBrowserDialogs
* Figure out how to enable chrome://flags features
* ~~Add support for chrome extensions (load unpacked local extension)~~
* ~~Add convenience utilities for working with extensions~~
* Figure out how to pre-install CWS extensions (e.g. uBlock Origin)
* Work on dockerized example, using `xfvb-run` and possibly `noVNC`
* Ensure compatibility with [`Browser Context`](https://github.com/GoogleChrome/puppeteer/pull/2523) once landed


## Changelog
* `1.1.0` - Add extensions support
* `1.0.1` - Initial public release



## Contributors

Thanks to @skyiea for [this PR](https://github.com/GoogleChrome/puppeteer/pull/1806)!






[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Buffer]: https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Page]: #class-page "Page"
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[stream.Readable]: https://nodejs.org/api/stream.html#stream_class_stream_readable "stream.Readable"
[CDPSession]: #class-cdpsession  "CDPSession"
[BrowserFetcher]: #class-browserfetcher  "BrowserFetcher"
[Error]: https://nodejs.org/api/errors.html#errors_class_error "Error"
[Frame]: #class-frame "Frame"
[ConsoleMessage]: #class-consolemessage "ConsoleMessage"
[ChildProcess]: https://nodejs.org/api/child_process.html "ChildProcess"
[Coverage]: #class-coverage "Coverage"
[iterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols "Iterator"
[Response]: #class-response  "Response"
[Request]: #class-request  "Request"
[Browser]: #class-browser  "Browser"
[Body]: #class-body  "Body"
[Element]: https://developer.mozilla.org/en-US/docs/Web/API/element "Element"
[Keyboard]: #class-keyboard "Keyboard"
[Dialog]: #class-dialog  "Dialog"
[JSHandle]: #class-jshandle "JSHandle"
[ExecutionContext]: #class-executioncontext "ExecutionContext"
[Mouse]: #class-mouse "Mouse"
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map"
[selector]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors "selector"
[Tracing]: #class-tracing "Tracing"
[ElementHandle]: #class-elementhandle "ElementHandle"
[UIEvent.detail]: https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/detail "UIEvent.detail"
[Serializable]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Description "Serializable"
[Touchscreen]: #class-touchscreen "Touchscreen"
[Target]: #class-target "Target"
[USKeyboardLayout]: ../lib/USKeyboardLayout.js "USKeyboardLayout"
[xpath]: https://developer.mozilla.org/en-US/docs/Web/XPath "xpath"
[UnixTime]: https://en.wikipedia.org/wiki/Unix_time "Unix Time"
[SecurityDetails]: #class-securitydetails "SecurityDetails"
