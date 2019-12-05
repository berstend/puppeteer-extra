export = defaultExport;
declare function defaultExport(opts?: {
    enabledEvasions?: Set<string>;
}): StealthPlugin;
declare const StealthPlugin_base: typeof import("puppeteer-extra-plugin").PuppeteerExtraPlugin;
/**
 * Stealth mode: Applies various techniques to make detection of headless puppeteer harder. 💯
 *
 * ### Purpose
 * There are a couple of ways the use of puppeteer can easily be detected by a target website.
 * The addition of `HeadlessChrome` to the user-agent being only the most obvious one.
 *
 * The goal of this plugin is to be the definite companion to puppeteer to avoid
 * detection, applying new techniques as they surface.
 *
 * As this cat & mouse game is in it's infancy and fast-paced the plugin
 * is kept as flexibile as possible, to support quick testing and iterations.
 *
 * ### Modularity
 * This plugin uses `puppeteer-extra`'s dependency system to only require
 * code mods for evasions that have been enabled, to keep things modular and efficient.
 *
 * The `stealth` plugin is a convenience wrapper that requires multiple [evasion techniques](./evasions/)
 * automatically and comes with defaults. You could also bypass the main module and require
 * specific evasion plugins yourself, if you whish to do so (as they're standalone `puppeteer-extra` plugins):
 *
 * ```es6
 * // bypass main module and require a specific stealth plugin directly:
 * puppeteer.use(require('puppeteer-extra-plugin-stealth/evasions/console.debug')())
 * ```
 *
 * ### Contributing
 * PRs are welcome, if you want to add a new evasion technique I suggest you
 * look at the [template](./evasions/_template) to kickstart things.
 *
 * ### Kudos
 * Thanks to [Evan Sangaline](https://intoli.com/blog/not-possible-to-block-chrome-headless/) and [Paul Irish](https://github.com/paulirish/headless-cat-n-mouse) for kickstarting the discussion!
 *
 * ---
 *
 * @todo
 * - white-/blacklist with url globs (make this a generic plugin method?)
 * - dynamic whitelist based on function evaluation
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * // Enable stealth plugin with all evasions
 * puppeteer.use(require('puppeteer-extra-plugin-stealth')())
 *
 *
 * ;(async () => {
 *   // Launch the browser in headless mode and set up a page.
 *   const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true })
 *   const page = await browser.newPage()
 *
 *   // Navigate to the page that will perform the tests.
 *   const testUrl = 'https://intoli.com/blog/' +
 *     'not-possible-to-block-chrome-headless/chrome-headless-test.html'
 *   await page.goto(testUrl)
 *
 *   // Save a screenshot of the results.
 *   const screenshotPath = '/tmp/headless-test-result.png'
 *   await page.screenshot({path: screenshotPath})
 *   console.log('have a look at the screenshot:', screenshotPath)
 *
 *   await browser.close()
 * })()
 *
 * @param {Object} [opts] - Options
 * @param {Set<string>} [opts.enabledEvasions] - Specify which evasions to use (by default all)
 *
 */
declare class StealthPlugin extends StealthPlugin_base {
    constructor(opts?: {});
    get defaults(): {
        availableEvasions: Set<string>;
        enabledEvasions: Set<any>;
    };
    /**
     * Get all available evasions.
     *
     * Please look into the [evasions directory](./evasions/) for an up to date list.
     *
     * @type {Set<string>} - A Set of all available evasions.
     *
     * @example
     * const pluginStealth = require('puppeteer-extra-plugin-stealth')()
     * console.log(pluginStealth.availableEvasions) // => Set { 'user-agent', 'console.debug' }
     * puppeteer.use(pluginStealth)
     */
    get availableEvasions(): Set<string>;
    /**
     * @private
     */
    set enabledEvasions(arg: Set<string>);
    /**
     * Get all enabled evasions.
     *
     * Enabled evasions can be configured either through `opts` or by modifying this property.
     *
     * @type {Set<string>} - A Set of all enabled evasions.
     *
     * @example
     * // Remove specific evasion from enabled ones dynamically
     * const pluginStealth = require('puppeteer-extra-plugin-stealth')()
     * pluginStealth.enabledEvasions.delete('console.debug')
     * puppeteer.use(pluginStealth)
     */
    get enabledEvasions(): Set<string>;
    onBrowser(browser: any): Promise<void>;
}
