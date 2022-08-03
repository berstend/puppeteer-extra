import { PluginRequirements, PuppeteerExtraPlugin, PuppeteerLaunchOption } from 'puppeteer-extra-plugin'

export interface PluginOptions {
}

export const argsToIgnore = [
  '--disable-extensions',
  '--disable-default-apps',
  '--disable-component-extensions-with-background-pages'
]

/**
 * A CDP driver like puppeteer can make use of various browser launch arguments that are
 * adversarial to mimicking a regular browser and need to be stripped when launching the browser.
 */
 export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'stealth/evasions/defaultArgs' {
    return 'stealth/evasions/defaultArgs'
  }

  get requirements(): PluginRequirements {
    return new Set(['runLast']) // So other plugins can modify launch options before
  }

  async beforeLaunch(options: PuppeteerLaunchOption = {}): Promise<void | PuppeteerLaunchOption> {
    options.ignoreDefaultArgs = options.ignoreDefaultArgs || []
    if (options.ignoreDefaultArgs === true) {
      // that means the user explicitly wants to disable all default arguments
      return
    }
    argsToIgnore.forEach(arg => {
      if ((options.ignoreDefaultArgs as string[]).includes(arg)) {
        return
      }
      (options.ignoreDefaultArgs as string[]).push(arg)
    })
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
