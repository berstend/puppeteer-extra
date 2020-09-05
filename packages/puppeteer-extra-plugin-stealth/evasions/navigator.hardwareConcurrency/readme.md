## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

- [class: Plugin](#class-plugin)

### class: [Plugin](https://github.com/berstend/puppeteer-extra/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/evasions/navigator.webdriver/index.js#L9-L23)

- `opts` (optional, default `{}`)

**Extends: PuppeteerExtraPlugin**

Allows faking CPU core number. This allows creating different profiles.
Will overwrite `navigator.hardwareConcurrency` property.

####Usage:

Return 4 cores instead of browser suggested default
`puppeteer.use(require('puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency')({'cores':4}));`


---