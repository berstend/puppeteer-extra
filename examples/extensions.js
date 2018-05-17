const PuppeteerExtra = require('../lib/PuppeteerExtra');
const EXT_PATH = '../../extension/dist/development';

(async () => {
  const puppeteer = new PuppeteerExtra()
  puppeteer.addExtensions(EXT_PATH)

  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()
  // Get all extensions currently loaded
  const extensions = await browser.getExtensions()
  // Get a specific extension by title
  const spotExtension = extensions.find(e => e.title.includes("Spot"))
  // Executed in the context of the extension page, access to window, etc. as well.
  // Console output will show up when inspecting the background page of the extension
  const res = await spotExtension.evaluate(`console.log("I was here");chrome.runtime.getManifest()`)
  console.log(spotExtension, res)
  //await page.goto("http://httpbin.org/headers", {waitUntil: "domcontentloaded"})
  await browser.close();
})()
