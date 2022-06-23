import { PuppeteerExtraPlugin, PuppeteerPage, PuppeteerRequest } from 'puppeteer-extra-plugin';

const availableTypes = [ 'document', 'stylesheet', 'image', 'media', 'font', 'script', 'texttrack', 'xhr', 'fetch', 'eventsource', 'websocket', 'manifest', 'other' ] as const

export type ResourceType = typeof availableTypes[number];

export interface PluginOptions {
  availableTypes: Set<ResourceType>,
  blockedTypes: Set<ResourceType>,
  interceptResolutionPriority?: number,
}

/**
 * Block resources (images, media, css, etc.) in puppeteer.
 *
 * Supports all resource types, blocking can be toggled dynamically.
 *
 * @param {Object} opts - Options
 * @param {Set<string>} [opts.blockedTypes] - Specify which resourceTypes to block (by default none)
 *
 * @example
 * const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require('puppeteer')
 * puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
 *   blockedTypes: new Set(['image', 'stylesheet']),
 *   // Optionally enable Cooperative Mode for several request interceptors
 *   interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
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
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'block-resources' {
    return 'block-resources'
  }

  get defaults(): PluginOptions {
    return {
      availableTypes: new Set(availableTypes),
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
  get availableTypes(): Set<string> {
    return this.defaults.availableTypes
  }

  /**
   * Get all blocked resource types.
   *
   * Blocked resource types can be configured either through `opts` or by modifying this property.
   *
   * @type {Set<string>} - A Set of all blocked resource types.
   */
  get blockedTypes(): Set<ResourceType> {
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
  async onRequest(request: PuppeteerRequest): Promise<void> {
    const type = request.resourceType()
    const shouldBlock = this.blockedTypes.has(type)

    // Requests are immediately handled if not using Cooperative Intercept Mode
    const alreadyHandled: boolean = (request as any).isInterceptResolutionHandled
      ? (request as any).isInterceptResolutionHandled()
      : true

    this.debug('onRequest', {
      type,
      shouldBlock,
      alreadyHandled
    })

    if (alreadyHandled) return

    if (shouldBlock) {
      const abortArgs: Array<any> = (request as any).abortErrorReason
        ? ['blockedbyclient', this.interceptResolutionPriority]
        : []

      return request.abort(...abortArgs)
    }

    const continueArgs: Array<any> = (request as any).continueRequestOverrides
      ? [(request as any).continueRequestOverrides(), this.interceptResolutionPriority]
      : []

    return request.continue(...continueArgs)
  }

  /**
   * @private
   */
  async onPageCreated(page: PuppeteerPage): Promise<void> {
    this.debug('onPageCreated', { blockedTypes: this.blockedTypes })
    await page.setRequestInterception(true)
    page.on('request', this.onRequest.bind(this))
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
