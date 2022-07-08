import { test, expect } from '../fixtures/extra'

import StealthPlugin from 'puppeteer-extra-plugin-stealth'

test('puppeteer-extra-plugin-stealth will work', async ({
  browserName,
  extraLauncher,
  _browserOptions
}) => {
  test.skip(browserName !== 'chromium', 'Chromium only')

  const pluginErrors = []
  extraLauncher.plugins.onPluginError = (plugin, method, err) => {
    pluginErrors.push(err)
  }

  extraLauncher.use(StealthPlugin())
  expect(extraLauncher.plugins.list.length).toEqual(1)
  expect(extraLauncher.plugins.list[0].name).toEqual('stealth')

  extraLauncher.plugins.setDependencyDefaults('stealth/evasions/webgl.vendor', {
    vendor: 'Bob',
    renderer: 'Alice'
  })

  const browser = await extraLauncher.launch(_browserOptions)
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('https://example.com')

  const webgl = await page.evaluate(getWebglUnmasked)
  expect(webgl).toStrictEqual({ renderer: 'Alice', vendor: 'Bob' })

  expect(pluginErrors).toStrictEqual([])

  await browser.close()
})

function getWebglUnmasked() {
  const gl = document.createElement('canvas').getContext('webgl') as any
  if (!gl) {
    return {
      error: 'no webgl'
    }
  }
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (debugInfo) {
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    }
  }
  return {
    error: 'no WEBGL_debug_renderer_info'
  }
}
