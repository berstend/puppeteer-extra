## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

- [class: Plugin](#class-plugin)

### class: [Plugin](https://github.com/berstend/puppeteer-extra/blob/ab0047d1af7dc38412744abdb61bcfc35c42dc34/packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.js#L42-L203)

- `opts` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** Options (optional, default `{}`)
  - `opts.userAgent` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** The user agent to use (default: browser.userAgent())
  - `opts.locale` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** The locale to use in `Accept-Language` header and in `navigator.languages` (default: `en-US,en`)
  - `opts.maskLinux` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** Wether to hide Linux as platform in the user agent or not - true by default

**Extends: PuppeteerExtraPlugin**

Fixes the UserAgent info (composed of UA string, Accept-Language, Platform, and UA hints).

If you don't provide any values this plugin will default to using the regular UserAgent string (while stripping the headless part).
Default language is set to "en-US,en", the other settings match the UserAgent string.
If you are running on Linux, it will mask the settins to look like Windows. This behavior can be disabled with the `maskLinux` option.

By default puppeteer will not set a `Accept-Language` header in headless:
It's (theoretically) possible to fix that using either `page.setExtraHTTPHeaders` or a `--lang` launch arg.
Unfortunately `page.setExtraHTTPHeaders` will lowercase everything and launch args are not always available. :)

In addition, the `navigator.platform` property is always set to the host value, e.g. `Linux` which makes detection very easy.

Note: You cannot use the regular `page.setUserAgent()` puppeteer call in your code,
as it will reset the language and platform values you set with this plugin.

Example:

```javascript
const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const stealth = StealthPlugin()
// Remove this specific stealth plugin from the default set
stealth.enabledEvasions.delete('user-agent-override')
puppeteer.use(stealth)

// Stealth plugins are just regular `puppeteer-extra` plugins and can be added as such
const UserAgentOverride = require('puppeteer-extra-plugin-stealth/evasions/user-agent-override')
// Define custom UA and locale
const ua = UserAgentOverride({
  userAgent: 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)',
  locale: 'de-DE,de'
})
puppeteer.use(ua)
```

---
