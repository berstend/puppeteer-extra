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
  console.debug("Result of window.addSeven(6):", res1)

  // Evaluate async function
  const res2 = await sampleExtension.evaluate(`window.addNineAsync(6)`)
  console.debug("Result of window.addNineAsync(6):", res2)

  // We have access to chrome APIs as well
  const res3 = await sampleExtension.evaluate(`chrome.runtime.getManifest()`)
  console.debug("Result of chrome.runtime.getManifest():", res3)

  // Console output will show up when inspecting the background page of the extension
  await sampleExtension.evaluate(`console.log("puppeteer-extra was here")`)

  await browser.close();
})()

/*
Result of the above:

Found sample extension { targetId: '4D9E700DA7F5BEA78B50FA4DC903BA18',
  type: 'background_page',
  title: 'Shiny Sample Extension',
  url: 'chrome-extension://lekbicckbfmgelnaehjfmgeofigialpe/_generated_background_page.html',
  attached: false,
  browserContextId: '21560410BB34F1979816C4E2A8E96C4D',
  evaluate: [AsyncFunction] }
Result of window.addSeven(6): { result: { type: 'number', value: 13, description: '13' } }
Result of window.addNineAsync(6): { result: { type: 'number', value: 15, description: '15' } }
Result of chrome.runtime.getManifest(): { result:
   { type: 'object',
     value:
      { background: [Object],
        current_locale: 'en_US',
        default_locale: 'en',
        description: 'Just a minimal sample Extension',
        manifest_version: 2,
        name: 'Shiny Sample Extension',
        version: '0.0.1' } } }
*/
