# @extra/proxy-router [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/berstend/puppeteer-extra/test.yml?branch=master&event=push)](https://github.com/berstend/puppeteer-extra/actions) [![Discord](https://img.shields.io/discord/737009125862408274)](https://extra.community) [![npm](https://img.shields.io/npm/v/@extra/proxy-router.svg)](https://www.npmjs.com/package/@extra/proxy-router)

> A plugin for [playwright-extra] and [puppeteer-extra] to route proxies dynamically.

## Install

```bash
yarn add @extra/proxy-router
# - or -
npm install @extra/proxy-router
```

<details>
 <summary>Playwright</summary>

If this is your first [playwright-extra] plugin here's everything you need:

```bash
yarn add playwright playwright-extra @extra/proxy-router
# - or -
npm install playwright playwright-extra @extra/proxy-router
```

</details>
<details>
 <summary>Puppeteer</summary>

If this is your first [puppeteer-extra] plugin here's everything you need:

```bash
yarn add puppeteer puppeteer-extra @extra/proxy-router
# - or -
npm install puppeteer puppeteer-extra @extra/proxy-router
```

</details>

### Compatibility

|           💫           | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chromium/chromium.png" alt="Chrome" width="24px" height="24px" />](#)<br/>Chromium | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](#)<br/>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](#)<br/>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Webkit" width="24px" height="24px" />](#)<br/>Webkit |
| :--------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| **[playwright-extra]** |                                                                               ✅                                                                               |                                                                               ✅                                                                               |                                                                                 ✅                                                                                 |                                                                               ✅                                                                               |
| **[puppeteer-extra]**  |                                                                               ✅                                                                               |                                                                               ✅                                                                               |                                      [🕒](https://github.com/berstend/puppeteer-extra/wiki/Is-Puppeteer-Firefox-ready-yet%3F)                                      |                                                                               -                                                                                |

| Headless | Headful | Launch |             Connect              |
| :------: | :-----: | :----: | :------------------------------: |
|    ✅    |   ✅    |   ✅   | ✅ <sup><sub>(local)</sub></sup> |

### Features

The plugin makes using proxies in the browser a lot more convenient:

- Handles proxy authentication
- Multiple proxies can be used
- Flexible proxy routing using the host/domain
- Change proxies dynamically after browser launch
- Collect traffic stats per proxy or host
- Uses native browser features, no performance loss

## Usage

> Using puppeteer? To use the following playwright examples simply change your [imports](#imports)

### Simple

A single proxy for all browser connections

```js
// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
// Note: Instead of chromium you can use firefox and webkit as well.
const { chromium } = require('playwright-extra')

// Configure and add the proxy router plugin with a default proxy
const ProxyRouter = require('@extra/proxy-router')
chromium.use(
  ProxyRouter({
    proxies: { DEFAULT: 'http://user:pass@proxyhost:port' },
  })
)

// That's it, the default proxy will be used and proxy authentication handled automatically
chromium.launch({ headless: false }).then(async (browser) => {
  const page = await browser.newPage()
  await page.goto('https://canhazip.com', { waitUntil: 'domcontentloaded' })
  const ip = await page.evaluate('document.body.innerText')
  console.log('Outbound IP:', ip)
  await browser.close()
})
```

### Dynamic routing

Use multiple proxies and route connections flexibly

```js
// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
// Note: Instead of chromium you can use firefox and webkit as well.
const { chromium } = require('playwright-extra')

// Configure the proxy router plugin
const ProxyRouter = require('@extra/proxy-router')
const proxyRouter = ProxyRouter({
  // define the available proxies (replace this with your proxies)
  proxies: {
    // the default browser proxy, can be `null` as well for direct connections
    DEFAULT: 'http://user:pass@proxyhost:port',
    // optionally define more proxies you can use in `routeByHost`
    // you can use whatever names you'd like for them
    DATACENTER: 'http://user:pass@proxyhost2:port',
    RESIDENTIAL_US: 'http://user:pass@proxyhost3:port',
  },
  // optional function for flexible proxy routing
  // if this is not specified the `DEFAULT` proxy will be used for all connections
  routeByHost: async ({ host }) => {
    if (['pagead2.googlesyndication.com', 'fonts.gstatic.com'].includes(host)) {
      return 'ABORT' // block connection to certain hosts
    }
    if (host.includes('google')) {
      return 'DIRECT' // use a direct connection for all google domains
    }
    if (host.endsWith('.tile.openstreetmap.org')) {
      return 'DATACENTER' // route heavy images through datacenter proxy
    }
    if (host === 'canhazip.com') {
      return 'RESIDENTIAL_US' // special proxy for this domain
    }
    // everything else will use `DEFAULT` proxy
  },
})

// Add the plugin
chromium.use(proxyRouter)

// Launch a browser and run some IP checks
chromium.launch({ headless: true }).then(async (browser) => {
  const page = await browser.newPage()

  await page.goto('https://showmyip.com/', { waitUntil: 'domcontentloaded' })
  const ip1 = await page.evaluate("document.querySelector('#ipv4').innerText")
  console.log('Outbound IP #1:', ip1)
  // => 77.191.128.0 (the DEFAULT proxy)

  await page.goto('https://canhazip.com', { waitUntil: 'domcontentloaded' })
  const ip2 = await page.evaluate('document.body.innerText')
  console.log('Outbound IP #2:', ip2)
  // => 104.179.129.27 (the RESIDENTIAL_US proxy)

  console.log(proxyRouter.stats.connectionLog) // list of connections (host => proxy name)
  // { id: 0, proxy: 'DIRECT', host: 'accounts.google.com' },
  // { id: 1, proxy: 'DEFAULT', host: 'www.showmyip.com' },
  // { id: 2, proxy: 'ABORT', host: 'pagead2.googlesyndication.com' },
  // { id: 3, proxy: 'DEFAULT', host: 'unpkg.com' },
  // ...

  console.log(proxyRouter.stats.byProxy) // bytes used by proxy
  // {
  //   DATACENTER: 441734,
  //   DEFAULT: 125823,
  //   DIRECT: 100457,
  //   RESIDENTIAL_US: 4764,
  //   ABORT: 0
  // }

  console.log(proxyRouter.stats.byHost) // bytes used by host
  // {
  //   'a.tile.openstreetmap.org': 150685,
  //   'c.tile.openstreetmap.org': 147054,
  //   'b.tile.openstreetmap.org': 143995,
  //   'unpkg.com': 57621,
  //   'www.googletagmanager.com': 49572,
  //   'www.showmyip.com': 40408,
  // ...

  await browser.close()
})
```

### Imports

<details>
 <summary>Usage with Puppeteer</summary><br/>

> The code is essentially the same as the playwright example above. :-)

Just change the import and package name:

```diff
- const { chromium } = require('playwright-extra')
+ const puppeteer = require('puppeteer-extra')
// ...
- chromium.use(proxyRouter)
+ puppeteer.use(proxyRouter)
// ...
- chromium.launch()
+ puppeteer.launch()
// ...
```

</details>

<details>
 <summary>Typescript & ESM</summary>
<br/>

> The plugin is written in Typescript and ships with types.

**Playwright:**

```js
// You can use any browser: chromium, firefox, webkit
import { firefox } from 'playwright-extra'
import ProxyRouter from '@extra/proxy-router'
// ...
firefox.use(proxyRouter)
```

**Puppeteer:**

```js
import puppeteer from 'puppeteer-extra'
import ProxyRouter from '@extra/proxy-router'
// ...
puppeteer.use(proxyRouter)
```

</details>

### Debug logs

If you'd like to see debug output just run your script like so:

```bash
# macOS/Linux (Bash)
DEBUG=*proxy-router* node myscript.js

# Windows (Powershell)
$env:DEBUG='*proxy-router*';node myscript.js
```

## How it works

The proxy router will launch a local proxy server and instruct the browser to use it.
That local proxy server will in turn connect to the configured upstream proxy servers and relay connections depending on the optional user-defined routing function, while handling upstream proxy authentication and a few other things.

## API

### Options

```ts
export interface ProxyRouterOpts {
  /**
   * A dictionary of proxies to be made available to the browser and router.
   *
   * An optional entry named `DEFAULT` will be used for all requests, unless overriden by `routeByHost`.
   * If the `DEFAULT` entry is omitted no proxy will be used by default.
   *
   * The value of an entry can be a string (format: `http://user:pass@proxyhost:port`) or `null` (direct connection).
   * Proxy authentication is handled automatically by the router.
   *
   * @example
   * proxies: {
   *   DEFAULT: "http://user:pass@proxyhost:port", // use this proxy by default
   *   RESIDENTIAL_US: "http://user:pass@proxyhost2:port" // use this for specific hosts with `routeByHost`
   * }
   */
  proxies?: {
    /**
     * The default proxy for the browser (format: `http://user:pass@proxyhost:port`),
     * if omitted or `null` no proxy will be used by default
     */
    DEFAULT?: string | null
    /**
     * Any other custom proxy names which can be used for routing later
     * (e.g. `'DATACENTER_US': 'http://user:pass@proxyhost:port'`)
     */
    [key: string]: string | null
  }

  /**
   * An optional function to allow proxy routing based on the target host of the request.
   *
   * A return value of nothing, `null` or `DEFAULT` will result in the DEFAULT proxy being used as configured.
   * A return value of `DIRECT` will result in no proxy being used.
   * A return value of `ABORT` will cancel/block this request.
   *
   * Any other string as return value is assumed to be a reference to the configured `proxies` dict.
   *
   * @note The browser will most often establish only a single proxy connection per host.
   *
   * @example
   * routeByHost: async ({ host }) => {
   *   if (host.includes('google')) { return "DIRECT" }
   *   return 'RESIDENTIAL_US'
   * }
   *
   */
  routeByHost?: RouteByHostFn
  /** Collect traffic and connection stats, default: true */
  collectStats?: boolean
  /** Don't print any proxy connection errors to stderr, default: false */
  muteProxyErrors?: boolean
  /** Suppress proxy errors for specific hosts */
  muteProxyErrorsForHost?: string[]
  /** Options for the local proxy-chain server  */
  proxyServerOpts?: ProxyServerOpts
  /**
   * Optionally exempt hosts from going through a proxy, even our internal routing proxy.
   *
   * Examples:
   * `.com` or `chromium.org` or `.domain.com`
   *
   * @see
   * https://chromium.googlesource.com/chromium/src/+/HEAD/net/docs/proxy.md#proxy-bypass-rules
   * https://www-archive.mozilla.org/quality/networking/docs/aboutno_proxy_for.html
   */
  proxyBypassList?: string[]
}
```

## Alternatives

### Proxy.pac files <sup><sub>[Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file)</sub></sup>

- Only supported in chromium in headful mode
  - Despite the name (`FindProxyForURL`) can only route by host
- Firefox supports PAC files and including the path through a pref
- Only loaded once at browser launch, no dynamic proxies possible
- Does not handle authentication

### Various "per-page proxy" plugins for puppeteer

- Advantage: Route proxies by page not host
- They rely on a massive hack: Using Node.js to send the requests instead of the browser
  - Will change the TLS fingerprint, error prone
- Uses CDP request interception which is chromium only
- Increased latency and resource overhead

## License

Copyright © 2018 - 2023, [berstend̡̲̫̹̠̖͚͓̔̄̓̐̄͛̀͘](https://github.com/berstend). Released under the MIT License.

<!--
  Reference links
-->

[playwright-extra]: https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra
[puppeteer-extra]: https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra
