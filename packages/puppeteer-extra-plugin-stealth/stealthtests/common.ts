import fs from 'fs'
import path from 'path'
import { PuppeteerPage } from 'puppeteer-extra-plugin';
import puppeteer from 'puppeteer'
// import { VanillaPuppeteer } from 'puppeteer-extra';

export function getChromePath(): string {
    const executablePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        `${process.env.programfiles}\\Google\\Chrome\\Application\\chrome.exe`,
    ]
    for (const p of executablePaths) {
        if (fs.existsSync(p))
            return p
    }
    throw Error('getChromePath mot found');
}

// startScript(__filename)
export function startScript(name: string) {
    const scriptName = path.basename(name)
    console.log('start', scriptName)
}

// await screenshot(__filename, page)
export async function screenshot(name: string, page: PuppeteerPage | puppeteer.Page) {
    const scriptName = path.basename(name).replace(/\.ts/, '.js');
    const screenshotPath = path.join(__dirname, '_results', `${scriptName}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log('done', screenshotPath)
}

const testUrl = 'https://bot.sannysoft.com/';

export async function performTest(browser: any, destination: string) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600 })
    console.log(`goto ${testUrl}`)
    await page.goto(testUrl)
    console.log('wait 5 sec')
    await page.waitForTimeout(5000)
    await screenshot(destination, page)
    console.log(`saving ${destination}`)
    await browser.close()  
    console.log(`pptr closed`)
  }
