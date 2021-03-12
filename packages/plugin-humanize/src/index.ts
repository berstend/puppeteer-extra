import {
  AutomationExtraPlugin,
  Playwright,
  NestedPartial
} from 'automation-extra-plugin'
import * as mouse from './mouse/spoof'
import * as mouseHelper from './mouse/helper'

import type { Puppeteer, Page } from 'automation-extra-plugin'

type PlaywrightClickOptions = Parameters<Playwright.Page['click']>

export interface MouseOpts {
  /** Enable human mouse movements when clicking */
  enabled: boolean
  /** Show a visible cursor (for testing, not for production) */
  showCursor: boolean
}

export interface HumanizePluginOpts {
  mouse: MouseOpts
}

export class HumanizePlugin extends AutomationExtraPlugin<HumanizePluginOpts> {
  constructor(opts: NestedPartial<HumanizePluginOpts> = {}) {
    super(opts)
  }

  static get id() {
    return 'humanize'
  }

  get defaults() {
    return {
      mouse: {
        enabled: true,
        showCursor: false
      }
    }
  }

  /** Enable the humanize plugin */
  public enable() {
    this.opts.mouse.enabled = true
  }

  /** Disable the humanize plugin */
  public disable() {
    this.opts.mouse.enabled = false
  }

  async onPageCreated(page: Page) {
    this.debug('onPageCreated', this.opts)
    if (!this.opts.mouse.enabled) {
      return
    }

    if (this.opts.mouse.showCursor) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      mouseHelper.installHelper(page, this.env)
    }

    const cursor = mouse.createCursor(page)

    // TODO: Support elementHandle.click
    page.click = ((originalMethod, ctx) => {
      return async (
        selector: string,
        options?: Puppeteer.ClickOptions | PlaywrightClickOptions | undefined
      ) => {
        if (!this.opts.mouse.enabled) {
          return await originalMethod.apply(ctx, [selector, options as any])
        }

        try {
          // TODO: Imitate regular page.click options (delay, etc)
          return await cursor.click(selector)
        } catch (err) {
          console.warn(
            `An error occured clicking on "${selector}":`,
            err.toString()
          )
          console.log('Skipping humanize and use vanilla click.')
          return await originalMethod.apply(ctx, [selector, options as any])
        }
      }
    })(page.click, page)
  }
}

/** Default export  */
const defaultExport = (opts?: NestedPartial<HumanizePluginOpts>) => {
  return new HumanizePlugin(opts)
}

export default defaultExport
