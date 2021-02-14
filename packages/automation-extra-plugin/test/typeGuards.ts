import test from 'ava'

import { TypeGuards } from '../.'

test('should have working type guards', async (t) => {
  const tg = new TypeGuards()

  const base = {
    Browser: {
      newPage: true,
      close: true,
    },
    Page: {
      goto: true,
      url: true,
    },
  }

  const puppeteer = {
    Browser: {
      ...base.Browser,
      createIncognitoBrowserContext: true,
    },
    Page: {
      ...base.Page,
      setUserAgent: true,
    },
    BrowserContext: {
      clearPermissionOverrides: true,
    },
  }

  const playwright = {
    Browser: {
      ...base.Browser,
      newContext: true,
    },
    Page: {
      ...base.Page,
      unroute: true,
    },
    BrowserContext: {
      addCookies: true,
    },
  }

  t.true(tg.isBrowser(base.Browser))
  t.false(tg.isBrowser(base.Page))
  t.true(tg.isPage(base.Page))
  t.false(tg.isPage(base.Browser))

  t.true(tg.isBrowser(puppeteer.Browser))
  t.true(tg.isBrowser(playwright.Browser))
  t.true(tg.isPage(puppeteer.Page))
  t.true(tg.isPage(playwright.Page))

  t.false(tg.isBrowser(puppeteer.Page))
  t.false(tg.isBrowser(playwright.Page))
  t.false(tg.isPage(puppeteer.Browser))
  t.false(tg.isPage(playwright.Browser))

  t.true(tg.isPuppeteerBrowser(puppeteer.Browser))
  t.false(tg.isPuppeteerBrowser(playwright.Browser))

  t.true(tg.isPlaywrightBrowser(playwright.Browser))
  t.false(tg.isPlaywrightBrowser(puppeteer.Browser))

  t.true(tg.isPuppeteerPage(puppeteer.Page))
  t.false(tg.isPuppeteerPage(playwright.Page))

  t.true(tg.isPlaywrightPage(playwright.Page))
  t.false(tg.isPlaywrightPage(puppeteer.Page))
})
