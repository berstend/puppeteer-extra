import puppeteer from 'puppeteer'
import playwright from 'playwright'

export * as puppeteer from 'puppeteer'
export * as playwright from 'playwright'

import { addExtra } from 'automation-extra'

export type Browser = 'chromium' | 'firefox' | 'webkit'
export type DriverShortName = 'pw' | 'pptr'

export type TestCasesPlaywright =
  | 'pw:all'
  | 'pw:chromium'
  | 'pw:firefox'
  | 'pw:webkit'
export type TestCasesPuppeteer = 'pptr:all' | 'pptr:chromium' | 'pptr:firefox'

export type TestCases = TestCasesPlaywright | TestCasesPuppeteer

export const availableBrowsersPlaywright: Browser[] = [
  'chromium',
  'firefox',
  'webkit'
]
export const availableBrowsersPuppeteer: Browser[] = ['chromium', 'firefox']

const getHelper = (driver: DriverShortName, browser: Browser) => {
  const getLauncher = () => {
    console.log({ driver, browser })
    if (driver === 'pptr') {
      if (browser === 'firefox') {
        // TODO: Test this actually works
        process.env.PUPPETEER_PRODUCT = 'firefox'
      }
      console.log((puppeteer as any).product)
      return puppeteer
    }
    if (driver === 'pw') {
      return playwright[browser]
    }
    throw new Error(`Unsupported driver: "${driver}"`)
  }

  const getLauncherWithExtra = () => addExtra(getLauncher())

  const getBrowserWithPlugin = async (plugin: any) => {
    const launcher = getLauncherWithExtra()
    launcher.use(plugin)
    const browser = await launcher.launch()
    return browser
  }

  const getPageWithPlugin = async (plugin: any) => {
    const browser = await getBrowserWithPlugin(plugin)
    const page = await browser.newPage()
    return { page, browser }
  }

  return {
    driverName: driver,
    browserName: browser,

    getLauncher,
    getLauncherWithExtra,
    getBrowserWithPlugin,
    getPageWithPlugin
  }
}

export const driver = (
  driver: DriverShortName = 'pptr',
  browser: Browser = 'chromium'
) => getHelper(driver, browser)

export const makeTest = (testFn: any) => {
  testFn.title = (title = '', driverName = '') => `${driverName}: ${title}`
  return testFn
}

export const withDriver = (
  ava: any,
  title: string,
  testFn: any,
  driverName: string
) => {
  testFn.title = (title = '', driverName = '') => `${driverName}: ${title}`
  ava(title, testFn, driverName)
}

export const wrap = (ava: any) => (cases: TestCases) => (
  title: string,
  testFn: any
) => {
  const driverName = cases.split(':')[0] as DriverShortName
  const browserName = cases.split(':')[1] as Browser | 'all'

  let browsers: Browser[] = []
  if (browserName === 'all') {
    if (driverName === 'pw') {
      browsers = availableBrowsersPlaywright
    }
    if (driverName === 'pptr') {
      browsers = availableBrowsersPuppeteer
    }
  } else {
    browsers = [browserName]
  }

  for (const browser of browsers) {
    testFn.title = (title = '', cases = '') =>
      `${driverName}(${browser}): ${title}`
    ava(title, testFn, driver(driverName, browser))
  }
}
