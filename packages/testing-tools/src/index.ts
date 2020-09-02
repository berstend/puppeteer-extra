import puppeteer from 'puppeteer'
import playwright from 'playwright'

export * as puppeteer from 'puppeteer'
export * as playwright from 'playwright'

import { addExtra } from 'automation-extra'

export type Browsers = 'chromium' | 'firefox' | 'webkit'
export type Drivers = 'playwright' | 'puppeteer'

export const getEnv = () => {
  const DRIVER = (process.env.DRIVER || 'puppeteer') as Drivers
  const BROWSER = (process.env.BROWSER || 'chromium') as Browsers
  return { DRIVER, BROWSER }
}

export const getLauncher = () => {
  const { DRIVER, BROWSER } = getEnv()
  console.log({ DRIVER, BROWSER })
  if (DRIVER === 'puppeteer') {
    return puppeteer
  }
  if (DRIVER === 'playwright') {
    return playwright[BROWSER]
  }
  throw new Error(`Unsupported driver: "${DRIVER}"`)
}

export const getLauncherWithExtra = () => addExtra(getLauncher())

export const getPageWithPlugin = async (plugin: any) => {
  const launcher = getLauncherWithExtra()
  launcher.use(plugin)

  const browser = await launcher.launch()
  const page = await browser.newPage()
  return { page, browser }
}
