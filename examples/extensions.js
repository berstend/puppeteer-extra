// In your code you'd use require('puppeteer-extra')
const PuppeteerExtra = require('../lib/PuppeteerExtra');

const EXT_PATH = `${__dirname}/_fixtures/sample-extension`;

(async () => {
  const puppeteer = new PuppeteerExtra()
  // Add local sample extension
  puppeteer.addExtensions(EXT_PATH)

  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()

  // Get all extensions currently loaded
  const extensions = await browser.getExtensions()

  // Get a specific extension by title
  const sampleExtension = extensions.find(e => e.title.includes("Shiny Sample"))
  console.debug("Found sample extension", sampleExtension)

  // By using .evaluate() we can run code executed in the context of the extensions background page
  const res1 = await sampleExtension.evaluate(`window.addSeven(6)`)
  console.debug("Result of window.addSeven(6)", res1)

  // We have access to chrome APIs as well
  const res2 = await sampleExtension.evaluate(`chrome.runtime.getManifest()`)
  console.debug("Result of chrome.runtime.getManifest()", res2)

  // Console output will show up when inspecting the background page of the extension
  await sampleExtension.evaluate(`console.log("puppeteer-extra was here")`)

  await browser.close();
})()
