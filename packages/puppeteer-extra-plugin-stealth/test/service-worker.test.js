const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('./util')
const Plugin = require('..')
const http = require('http')
const fs = require('fs')
const path = require('path')

// Create a simple HTTP server. Service Workers cannot be served from file:// URIs
const httpServer = async () => {
  const server = await http
    .createServer((req, res) => {
      let contents, type

      if (req.url === '/sw.js') {
        contents = fs.readFileSync(path.join(__dirname, './fixtures/sw.js'))
        type = 'application/javascript'
      } else {
        contents = fs.readFileSync(
          path.join(__dirname, './fixtures/dummy-with-service-worker.html')
        )
        type = 'text/html'
      }

      res.setHeader('Content-Type', type)
      res.writeHead(200)
      res.end(contents)
    })
    .listen(0) // random free port

  return `http://127.0.0.1:${server.address().port}/`
}

let browser, page, worker

test.before(async t => {
  const address = await httpServer()
  console.log(`Server is running on port ${address}`)

  browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true })
  page = await browser.newPage()

  worker = new Promise(resolve => {
    browser.on('targetcreated', async target => {
      if (target.type() === 'service_worker') {
        resolve(target.worker())
      }
    })
  })

  await page.goto(address)
  worker = await worker
})

test.after(async t => {
  await browser.close()
})

test.skip('stealth: inconsistencies between page and worker', async t => {
  const pageFP = await page.evaluate(detectFingerprint)
  const workerFP = await worker.evaluate(detectFingerprint)

  t.deepEqual(pageFP, workerFP)
})

test.serial.skip('stealth: creepjs has good trust score', async t => {
  page.goto('https://abrahamjuliot.github.io/creepjs/')

  const score = await (
    await (
      await page.waitForSelector('#fingerprint-data .unblurred')
    ).getProperty('textContent')
  ).jsonValue()

  t.true(
    parseInt(score) > 80,
    `The creepjs score is: ${parseInt(score)}% but it should be at least 80%`
  )
})

/* global OffscreenCanvas */
function detectFingerprint() {
  const results = {}

  const props = [
    'userAgent',
    'language',
    'hardwareConcurrency',
    'deviceMemory',
    'languages',
    'platform'
  ]
  props.forEach(el => {
    results[el] = navigator[el].toString()
  })

  const canvasOffscreenWebgl = new OffscreenCanvas(256, 256)
  const contextWebgl = canvasOffscreenWebgl.getContext('webgl')
  const rendererInfo = contextWebgl.getExtension('WEBGL_debug_renderer_info')
  results.webglVendor = contextWebgl.getParameter(
    rendererInfo.UNMASKED_VENDOR_WEBGL
  )
  results.webglRenderer = contextWebgl.getParameter(
    rendererInfo.UNMASKED_RENDERER_WEBGL
  )

  results.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return results
}
