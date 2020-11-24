import puppeteer from 'puppeteer'
import playwright from 'playwright'

export * as puppeteer from 'puppeteer'
export * as playwright from 'playwright'

import { addExtra } from 'automation-extra'

export type BrowserName = 'chromium' | 'firefox' | 'webkit'
export type DriverName = 'playwright' | 'puppeteer'

export type TestCasesPlaywright =
  | 'playwright:all'
  | 'playwright:chromium'
  | 'playwright:firefox'
  | 'playwright:webkit'
export type TestCasesPuppeteer =
  | 'puppeteer:all'
  | 'puppeteer:chromium'
  | 'puppeteer:firefox'

export type TestCases = TestCasesPlaywright | TestCasesPuppeteer

export const availableBrowsersPlaywright: BrowserName[] = [
  'chromium',
  'firefox',
  'webkit'
]
export const availableBrowsersPuppeteer: BrowserName[] = ['chromium', 'firefox']

const getHelper = (driverName: DriverName, browserName: BrowserName) => {
  const getLauncher = () => {
    // console.log({ driver: driverName, browser: browserName })
    if (driverName === 'puppeteer') {
      return puppeteer
    }
    if (driverName === 'playwright') {
      return playwright[browserName]
    }
    throw new Error(`Unsupported driver: "${driverName}"`)
  }

  const getLauncherWithExtra = () => addExtra(getLauncher())

  const getBrowser = async (plugin?: any) => {
    const launcher = getLauncherWithExtra()
    if (plugin) {
      launcher.use(plugin)
    }
    const options = {
      headless: process.env.HEADFUL !== 'true'
    } as any

    if (driverName === 'puppeteer') {
      options.product = browserName === 'chromium' ? 'chrome' : browserName
      if (browserName === 'firefox') {
        options.executablePath = getFirefoxExecutablePath()
      }
    }
    const browser = await launcher.launch(options)
    return { browser, launcher }
  }

  const getPage = async (plugin?: any) => {
    const { browser, launcher } = await getBrowser(plugin)
    const page = await browser.newPage()
    return { page, browser, launcher }
  }

  return {
    driverName,
    browserName,
    getLauncher,
    getLauncherWithExtra,
    getBrowser,
    getPage
  }
}

export const driver = (
  driver: DriverName = 'puppeteer',
  browser: BrowserName = 'chromium'
) => getHelper(driver, browser)

interface WrapOpts {
  exclude?: TestCases[]
}

export const wrap = (ava: any) => (
  cases: TestCases | TestCases[],
  opts?: WrapOpts
) => (title: string, testFn: any) => {
  if (process.env.TEST_CASE) {
    cases = process.env.TEST_CASE as TestCases
  }
  const entries = Array.isArray(cases) ? cases : [cases]
  for (const entry of entries) {
    const driverName = entry.split(':')[0] as DriverName
    const browserName = entry.split(':')[1] as BrowserName | 'all'
    let browsers: BrowserName[] = []
    if (browserName === 'all') {
      if (driverName === 'playwright') {
        browsers = availableBrowsersPlaywright
      }
      if (driverName === 'puppeteer') {
        browsers = availableBrowsersPuppeteer
      }
    } else {
      browsers = [browserName]
    }
    for (const browser of browsers) {
      if (opts?.exclude?.includes(`${driverName}:${browser}` as TestCases)) {
        continue
      }
      testFn.title = (title = '', cases = '') =>
        `${driverName}(${browser}): ${title}`
      ava(title, testFn, driver(driverName, browser))
    }
  }
}

// Puppeteer's Firefox support/launching is buggy
function getFirefoxExecutablePath() {
  if (process.env.FIREFOX_EXECUTABLE_PATH) {
    return process.env.FIREFOX_EXECUTABLE_PATH
  }
  const {
    BrowserFetcher
  } = require('puppeteer/lib/cjs/puppeteer/node/BrowserFetcher.js')
  const browserFetcher = new BrowserFetcher(
    require('path').dirname(require.resolve('puppeteer')),
    {
      product: 'firefox'
    }
  )
  return browserFetcher.revisionInfo('latest').executablePath
}
