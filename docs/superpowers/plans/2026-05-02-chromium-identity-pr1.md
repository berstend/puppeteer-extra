# Chromium Identity PR1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared Chromium identity resolver, move `user-agent-override` onto it, and make Playwright Chromium consume the same UA/locale/platform policy as Puppeteer.

**Architecture:** Keep PR1 narrow. Introduce a pure internal resolver under the stealth package, let `user-agent-override` become the first consumer, and only touch Playwright lifecycle code where needed to carry the same identity policy into Chromium contexts/pages. Preserve existing plugin entrypoints and avoid broad evasion refactors.

**Tech Stack:** Node.js, CommonJS in stealth evasions, TypeScript in `playwright-extra`, AVA, Playwright Test, Puppeteer CDP `Network.setUserAgentOverride`.

---

### Task 1: Add the Chromium identity resolver module

**Files:**
- Create: `packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.js`
- Create: `packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.test.js`
- Read: `packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.js`
- Read: `packages/puppeteer-extra-plugin-stealth/test/util.js`

- [ ] **Step 1: Write the failing resolver tests**

```js
const test = require('ava')
const {
  resolveChromiumIdentity,
  parseLocale,
  computeBrands
} = require('./index')

test('parseLocale returns primary locale and language list', t => {
  t.deepEqual(parseLocale('en-US,en'), {
    locale: 'en-US',
    languages: ['en-US', 'en'],
    acceptLanguage: 'en-US,en;q=0.9'
  })
})

test('resolveChromiumIdentity keeps native Linux by default', t => {
  const identity = resolveChromiumIdentity({
    browserVersion: 'Chrome/148.0.7778.97',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36',
    locale: 'en-US,en',
    runtimeArch: 'x64',
    maskLinux: false,
    framework: 'puppeteer',
    headless: true
  })

  t.true(identity.userAgent.includes('Linux'))
  t.is(identity.platform, 'Linux')
})

test('resolveChromiumIdentity derives modern macOS UA-CH values', t => {
  const identity = resolveChromiumIdentity({
    browserVersion: 'Chrome/148.0.7778.97',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36',
    locale: 'en-US,en',
    runtimeArch: 'arm64',
    framework: 'puppeteer',
    headless: true
  })

  t.is(identity.userAgentMetadata.platform, 'macOS')
  t.is(identity.userAgentMetadata.architecture, 'arm')
  t.is(identity.userAgentMetadata.platformVersion, '26.2.0')
  t.false(identity.userAgent.includes('HeadlessChrome/'))
})

test('computeBrands includes Chromium, Google Chrome, and grease entry', t => {
  const brands = computeBrands({ browserMajorVersion: 148, browserFamily: 'chrome' })
  t.is(brands.length, 3)
  t.true(brands.some(entry => entry.brand === 'Chromium'))
  t.true(brands.some(entry => entry.brand === 'Google Chrome'))
  t.true(brands.some(entry => entry.version === '99'))
})
```

- [ ] **Step 2: Run the resolver tests to verify they fail**

Run:

```bash
PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  npx ava packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.test.js
```

Expected: FAIL because `./index` does not exist yet.

- [ ] **Step 3: Write the minimal resolver implementation**

```js
'use strict'

function parseLocale(locale = 'en-US,en') {
  const languages = locale.split(',').map(part => part.trim()).filter(Boolean)
  const primary = languages[0] || 'en-US'
  const acceptLanguage = languages
    .map((lang, index) => (index === 0 ? lang : `${lang};q=${(1 - index * 0.1).toFixed(1)}`))
    .join(',')
  return { locale: primary, languages, acceptLanguage }
}

function resolveChromiumIdentity(input) {
  // Normalize UA, browser family, platform labels, runtime architecture,
  // locale/languages, and UA-CH metadata in one place.
}

module.exports = {
  parseLocale,
  resolveChromiumIdentity,
  computeBrands,
  buildUserAgentMetadata
}
```

- [ ] **Step 4: Re-run the resolver tests and make them pass**

Run:

```bash
PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  npx ava packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit the resolver slice**

```bash
git add \
  packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.js \
  packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.test.js

git commit -m "feat(stealth): add chromium identity resolver"
```

### Task 2: Move `user-agent-override` onto the resolver

**Files:**
- Modify: `packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.js`
- Modify: `packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.test.js`
- Read: `packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/readme.md`

- [ ] **Step 1: Add failing tests for new identity behavior**

```js
test('stealth: default UA coherence keeps native mac platform metadata', async t => {
  const page = await _testUAHint(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    'en-US'
  )
  if (!page) {
    t.pass()
    return
  }
  const results = await page.evaluate(userAgentData)
  t.is(results.platform, 'macOS')
})

test('stealth: Linux masking only happens when explicitly requested', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
    })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const platform = await page.evaluate(() => navigator.platform)
  t.is(platform, 'Linux')
})
```

- [ ] **Step 2: Run the focused UA override tests to verify they fail first**

Run:

```bash
PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npx ava packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.test.js \
  --match='stealth: default UA coherence keeps native mac platform metadata' \
  --match='stealth: Linux masking only happens when explicitly requested'
```

Expected: FAIL because the plugin still uses legacy hardcoded metadata and default Linux masking.

- [ ] **Step 3: Refactor the plugin to resolve identity once and reuse it**

```js
const {
  resolveChromiumIdentity,
  formatUserAgentOverride
} = require('../_identity')

class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
    this._framework = 'puppeteer'
    this._headless = false
    this._resolvedIdentity = null
  }

  async onPluginRegistered(env = {}) {
    if (env.framework) {
      this._framework = env.framework
    }
  }

  async beforeLaunch(options) {
    this._headless = !!options.headless
    return options
  }

  async beforeContext(options, browser) {
    // Playwright Chromium only: set locale/userAgent at context creation time.
  }

  async onPageCreated(page) {
    // Resolve once from browser userAgent/version + runtime arch and send CDP override.
  }
}
```

- [ ] **Step 4: Re-run the focused UA override tests and the resolver tests**

Run:

```bash
PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npx ava packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.test.js

PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  npx ava packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit the UA override refactor**

```bash
git add \
  packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.js \
  packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.test.js

git commit -m "refactor(stealth): resolve ua overrides from chromium identity"
```

### Task 3: Make Playwright carry the same identity policy

**Files:**
- Modify: `packages/playwright-extra/src/plugins.ts`
- Modify: `packages/playwright-extra/src/extra.ts`
- Modify: `packages/playwright-extra/test/puppeteer-plugins/stealth.spec.ts`
- Optionally create: `packages/playwright-extra/test/puppeteer-plugins/stealth-identity.spec.ts`

- [ ] **Step 1: Add failing Playwright parity tests**

```ts
test('stealth identity carries locale and UA metadata in Chromium', async ({
  extraLauncher,
  _browserOptions,
  browserName
}) => {
  test.skip(browserName !== 'chromium', 'Chromium only')

  extraLauncher.use(StealthPlugin({ locale: 'de-DE,de' }))
  const browser = await extraLauncher.launch({
    ..._browserOptions,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('https://example.com')

  const results = await page.evaluate(async () => ({
    language: navigator.language,
    platform: navigator.platform,
    ua: navigator.userAgent,
    uaData: 'userAgentData' in navigator
      ? await navigator.userAgentData.getHighEntropyValues([
          'architecture',
          'platform',
          'platformVersion',
          'uaFullVersion'
        ])
      : null
  }))

  expect(results.language).toBe('de-DE')
  expect(results.ua).not.toContain('HeadlessChrome/')
})
```

- [ ] **Step 2: Run the Playwright parity test and verify it fails first**

Run:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npx playwright test --config packages/playwright-extra/test/playwright.config.ts \
  packages/playwright-extra/test/puppeteer-plugins/stealth.spec.ts \
  --project=chromium
```

Expected: FAIL because `beforeContext` is not shimming Puppeteer plugins and existing persistent/default pages are not guaranteed to receive the same identity flow.

- [ ] **Step 3: Patch Playwright lifecycle plumbing minimally**

```ts
const methodWhitelist: PluginMethodName[] = [
  'onBrowser',
  'onPageCreated',
  'onPageClose',
  'afterConnect',
  'afterLaunch',
  'beforeContext'
]
```

```ts
protected async _bindBrowserContextEvents(context: pw.BrowserContext, contextOptions?: pw.BrowserContextOptions) {
  this.plugins.dispatch('onContextCreated', context, contextOptions)
  for (const page of context.pages()) {
    this.plugins.dispatch('onPageCreated', page)
  }
  // keep the existing newPage patch for non-identity evasions
}
```

- [ ] **Step 4: Re-run the Playwright Chromium test and make it pass**

Run:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npx playwright test --config packages/playwright-extra/test/playwright.config.ts \
  packages/playwright-extra/test/puppeteer-plugins/stealth.spec.ts \
  --project=chromium
```

Expected: PASS.

- [ ] **Step 5: Commit the Playwright slice**

```bash
git add \
  packages/playwright-extra/src/plugins.ts \
  packages/playwright-extra/src/extra.ts \
  packages/playwright-extra/test/puppeteer-plugins/stealth.spec.ts

git commit -m "feat(playwright-extra): carry chromium stealth identity"
```

### Task 4: Build the touched packages and run final focused verification

**Files:**
- Modify only if verification reveals issues in the files above.

- [ ] **Step 1: Build the packages required by the focused tests**

Run:

```bash
PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  npx --yes yarn workspace puppeteer-extra-plugin build

PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  npx --yes yarn workspace puppeteer-extra build

PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  npx --yes yarn workspace playwright-extra build
```

Expected: each build exits 0.

- [ ] **Step 2: Run the final focused Puppeteer verification**

Run:

```bash
PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npx ava packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.test.js \
          packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.test.js
```

Expected: PASS.

- [ ] **Step 3: Run the final focused Playwright Chromium verification**

Run:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npx playwright test --config packages/playwright-extra/test/playwright.config.ts \
  packages/playwright-extra/test/puppeteer-plugins/stealth.spec.ts \
  --project=chromium
```

Expected: PASS.

- [ ] **Step 4: Review the diff against the spec acceptance criteria**

Checklist:

```text
- identity resolver exists
- user-agent-override uses resolver
- Puppeteer + Playwright Chromium consume same identity logic
- UA / UA-CH / locale / platform tests exist and pass
- PR1 scope stayed limited to identity core + UA coherence
```

- [ ] **Step 5: Commit the final verification adjustments**

```bash
git add packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.js \
        packages/puppeteer-extra-plugin-stealth/evasions/_identity/index.test.js \
        packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.js \
        packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.test.js \
        packages/playwright-extra/src/plugins.ts \
        packages/playwright-extra/src/extra.ts \
        packages/playwright-extra/test/puppeteer-plugins/stealth.spec.ts

git commit -m "test(stealth): verify chromium identity coherence pr1"
```
