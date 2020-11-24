const fs = require('fs')
const path = require('path')

const {
  BrowserFetcher
} = require('puppeteer/lib/cjs/puppeteer/node/BrowserFetcher.js')

const {
  downloadBrowser
} = require('puppeteer/lib/cjs/puppeteer/node/install.js')

const fetchUrl = url =>
  new Promise((resolve, reject) => {
    require('https')
      .get(url, resp => {
        let data = ''
        resp.on('data', chunk => {
          data += chunk
        })
        resp.on('end', () => {
          resolve(data)
        })
      })
      .on('error', err => {
        reject(err)
      })
  })

async function main() {
  const browserFetcher = new BrowserFetcher(
    path.join(process.cwd(), './node_modules/puppeteer'),
    {
      product: 'firefox'
    }
  )
  const firefoxVersion = JSON.parse(
    await fetchUrl(
      'https://product-details.mozilla.org/1.0/firefox_versions.json'
    )
  ).FIREFOX_NIGHTLY

  const sourceDir = browserFetcher.revisionInfo(firefoxVersion).folderPath
  const targetDir = browserFetcher.revisionInfo('latest').folderPath

  process.env.PUPPETEER_PRODUCT = 'firefox'
  await downloadBrowser()

  try {
    await fs.promises.unlink(targetDir)
  } catch (err) {}

  try {
    await fs.promises.symlink(sourceDir, targetDir)
  } catch (err) {
    console.log(err)
  }

  console.log(`${sourceDir} => ${targetDir}`)
}

main()
