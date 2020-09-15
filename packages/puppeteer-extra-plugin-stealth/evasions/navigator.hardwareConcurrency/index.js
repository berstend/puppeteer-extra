'use strict'

const {PuppeteerExtraPlugin} = require('puppeteer-extra-plugin')

/**
 * Allows faking CPU core number. This allows creating different profiles.
 * Will overwrite `navigator.hardwareConcurrency` property.
 */
class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
        super(opts)
    }

    get name() {
        return 'stealth/evasions/navigator.hardwareConcurrency'
    }


    async onPageCreated(page) {
        await page.evaluateOnNewDocument((cores) => {
            let originalCores = navigator.hardwareConcurrency;
             cores = cores || originalCores;
            delete Object.getPrototypeOf(navigator).hardwareConcurrency;
            Object.getPrototypeOf(navigator).hardwareConcurrency = cores || originalCores;
        }, this.opts.cores)
    }
}

module.exports = function (pluginConfig) {
    return new Plugin(pluginConfig)
}
