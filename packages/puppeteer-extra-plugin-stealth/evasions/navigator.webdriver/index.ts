import { PuppeteerExtraPlugin, PuppeteerLaunchOption, PuppeteerPage } from 'puppeteer-extra-plugin'

export interface PluginOptions {
}

/**
 * Pass the Webdriver Test.
 * Will delete `navigator.webdriver` property.
 */
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'stealth/evasions/navigator.webdriver' {
    return 'stealth/evasions/navigator.webdriver'
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      if (navigator.webdriver === false) {
        // Post Chrome 89.0.4339.0 and already good
      } else if (navigator.webdriver === undefined) {
        // Pre Chrome 89.0.4339.0 and already good
      } else {
        // Pre Chrome 88.0.4291.0 and needs patching
        delete Object.getPrototypeOf(navigator).webdriver
      }
    })
  }

  // Post Chrome 88.0.4291.0
  // Note: this will add an infobar to Chrome with a warning that an unsupported flag is set
  // To remove this bar on Linux, run: mkdir -p /etc/opt/chrome/policies/managed && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json
  async beforeLaunch(options: PuppeteerLaunchOption = {}): Promise<void | PuppeteerLaunchOption> {
    options.args = options.args || [];
    // If disable-blink-features is already passed, append the AutomationControlled switch
    const idx = options.args.findIndex(arg =>
      arg.startsWith('--disable-blink-features=')
    )
    if (idx !== -1) {
      const arg = options.args[idx]
      options.args[idx] = `${arg},AutomationControlled`
    } else {
      options.args.push('--disable-blink-features=AutomationControlled')
    }
    return options;
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
