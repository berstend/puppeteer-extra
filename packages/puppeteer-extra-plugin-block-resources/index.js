'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Block resources (images, media, css, etc.) in puppeteer.
 *
 * Supports all resource types, blocking can be toggled dynamically.
 *
 * @param {Object} opts - Options
 * @param {Set<string>} [opts.blockedTypes] - Specify which resourceTypes to block (by default none)
 *
 * @example
 * puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
 *   blockedTypes: new Set(['image', 'stylesheet']),
 *   // Optionally enable Cooperative Mode for several request interceptors
 *   interceptResolutionPriority: 0
 * }))
 *
 * //
 * // and/or dynamically:
 * //
 *
 * const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')()
 * puppeteer.use(blockResourcesPlugin)
 *
 * const browser = await puppeteer.launch({ headless: false })
 * const page = await browser.newPage()
 *
 * blockResourcesPlugin.blockedTypes.add('image')
 * await page.goto('http://www.msn.com/', {waitUntil: 'domcontentloaded'})
 *
 * blockResourcesPlugin.blockedTypes.add('stylesheet')
 * blockResourcesPlugin.blockedTypes.add('other') // e.g. favicon
 * await page.goto('http://news.ycombinator.com', {waitUntil: 'domcontentloaded'})
 *
 * blockResourcesPlugin.blockedTypes.delete('stylesheet')
 * blockResourcesPlugin.blockedTypes.delete('other')
 * blockResourcesPlugin.blockedTypes.add('media')
 * blockResourcesPlugin.blockedTypes.add('script')
 * await page.goto('http://www.youtube.com', {waitUntil: 'domcontentloaded'})
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'block-resources'
  }

  get defaults() {
    return {
      availableTypes: new Set([
        'document',
        'stylesheet',
        'image',
        'media',
        'font',
        'script',
        'texttrack',
        'xhr',
        'fetch',
        'eventsource',
        'websocket',
        'manifest',
        'other'
      ]),
      // Block nothing by default
      blockedTypes: new Set([]),
      interceptResolutionPriority: undefined
    }
  }

  /**
   * Get all available resource types.
   *
   * Resource type will be one of the following: `document`, `stylesheet`, `image`, `media`, `font`, `script`, `texttrack`, `xhr`, `fetch`, `eventsource`, `websocket`, `manifest`, `other`.
   *
   * @type {Set<string>} - A Set of all available resource types.
   */
  get availableTypes() {
    return this.defaults.availableTypes
  }

  /**
   * Get all blocked resource types.
   *
   * Blocked resource types can be configured either through `opts` or by modifying this property.
   *
   * @type {Set<string>} - A Set of all blocked resource types.
   */
  get blockedTypes() {
    return this.opts.blockedTypes
  }

  /**
   * Get the request interception resolution priority.
   *
   * Priority for Cooperative Intercept Mode can be configured either through `opts` or by modifying this property.
   *
   * @type {number} - A number for the request interception resolution priority.
   */
  get interceptResolutionPriority() {
    return this.opts.interceptResolutionPriority
  }

  /**
   * @private
   */
  onRequest(request) {
    const type = request.resourceType()
    const shouldBlock = this.blockedTypes.has(type)

    // Cooperative Intercept Mode only available in puppeteer@11+
    const [currentResolution, currentPriority] = request.interceptResolution
      ? request.interceptResolution()
      : []

    // Avoid using resolution `alreay-handled` with typo
    // Requests are immediately handled in Legacy Mode
    const alreadyHandled = currentResolution
      ? currentResolution.endsWith('handled')
      : true

    this.debug('onRequest', {
      type,
      shouldBlock,
      currentResolution,
      currentPriority
    })

    if (alreadyHandled) return

    if (shouldBlock) {
      const abortArgs = request.continueRequestOverrides
        ? ['blockedbyclient', this.interceptResolutionPriority]
        : []

      return request.abort(...abortArgs)
    }

    const continueArgs = request.continueRequestOverrides
      ? [request.continueRequestOverrides(), this.interceptResolutionPriority]
      : []

    return request.continue(...continueArgs)
  }

  /**
   * @private
   */
  async onPageCreated(page) {
    this.debug('onPageCreated', { blockedTypes: this.blockedTypes })
    await page.setRequestInterception(true)
    page.on('request', this.onRequest.bind(this))
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
