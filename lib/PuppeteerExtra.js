const puppeteer = require("puppeteer")

const os = require('os');
const path = require('path');
const fs = require('fs');
const util = require('util');
const removeFolder = require('rimraf');
const merge = require('deepmerge');
const mkdirpAsync = require('mkdirp-promise')

const mkdirAsync = util.promisify(fs.mkdir);
const writeFileAsync = util.promisify(fs.writeFile);
const mkdtempAsync = util.promisify(fs.mkdtemp);
const removeFolderAsync = util.promisify(removeFolder);

const CHROME_PROFILE_PATH = path.join(os.tmpdir(), 'puppeteer_dev_profile-');
const PREFS = {}

// After much tinkering: These prefs seem to reliably whitelist flash
PREFS.ALLOW_FLASH = {
  profile: {
    content_settings: {
      exceptions: {
        flash_data: {
          '*,*': {
            setting: {
              flashPreviouslyChanged: true
            }
          }
        },
        permission_autoblocking_data: {
          '*,*': {
            setting: {
              Flash: {
                dismiss_count: 1
              }
            }
          }
        },
        plugins: {
          '*,*': {
            per_resource: {
              'adobe-flash-player': 1
            }
          }
        }
      },
      pref_version: 1
    }
  }
}

PREFS.DISABLE_GEOLOCATION_API = {
  profile: {
    default_content_setting_values: {
      geolocation: 2
    }
  }
}

const delay = ms => new Promise(_ => setTimeout(_, ms));

module.exports = class {
  constructor(opts={}) {
    // Populated by .launch()
    this.browser = null;
    this.options = {
      args: []
    };

    this.temporaryUserDataDir = null;
    this.flashSettings = {};
    this.extensions = []

    this.prefs = opts.prefs || {};
    const defaultExtras = {
      stealth: false,
      allowFlash: false,
      keepTemporaryUserDataDir: false,
    }
    this.extras = opts.extras || defaultExtras;
  }

  setUserPreferences(prefs={}) {
    this.prefs = prefs
    return this
  }

  setExtras(extras={}) {
    this.extras = Object.assign({}, this.extras, extras)
    return this
  }

  setFlashSettings(path, version=9000) {
    this.flashSettings = {
      path, version
    }
    return this
  }

  addExtensions(paths=[]) {
    this.extensions = Array.isArray(paths) ? paths : [paths]
    this.options.args.push(`--disable-extensions-except=${this.extensions.join(",")}`)
    this.options.args.push(`--load-extension=${this.extensions.join(",")}`)
    console.log("addext", this.options)
  }

  get hasFlashSettings() {
    return !!(this.flashSettings.path)
  }

  get hasUserPreferences() {
    return !!(Object.keys(this.prefs).length)
  }

  get usesCustomBrowser() {
    return !!(this.options.executablePath)
  }

  get shouldCleanUp() {
    return !!(this.temporaryUserDataDir && !this.extras.keepTemporaryUserDataDir)
  }

  findInArgs(str) {
    return (this.options.args || []).find(e => e.includes(str))
  }
  findIndexInArgs(str) {
    return (this.options.args || []).findIndex(e => e.includes(str))
  }

  async anonymizeUA(page) {
    const old = await this.browser.userAgent()
    let ua = old
    // User Agent only differs in headless mode
    if (this.options.headless) {
      ua = ua.replace("HeadlessChrome/", "Chrome/")
    }
    // Set platform to Windows 10, x64
    ua = ua.replace(/\(([^\)]+)\)/, "(Windows NT 10.0; Win64; x64)")
    await page.setUserAgent(ua)
  }

  // Taken from: https://github.com/paulirish/headless-cat-n-mouse/blob/master/apply-evasions.js
  async enableDetectionEvasion(page) {
    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });
    });

    // Pass the Chrome Test.
    await page.evaluateOnNewDocument(() => {
      // We can mock this in as much depth as we need for the test.
      window.chrome = {
        runtime: {}
      };
    });

    // Pass the Permissions Test.
    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.__proto__.query = parameters =>
        parameters.name === 'notifications'
          ? Promise.resolve({state: Notification.permission})
          : originalQuery(parameters);

        // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js
        const oldCall = Function.prototype.call;
        function call() {
            return oldCall.apply(this, arguments);
        }
        Function.prototype.call = call;

        const nativeToStringFunctionString = Error.toString().replace(/Error/g, "toString");
        const oldToString = Function.prototype.toString;

        function functionToString() {
          if (this === window.navigator.permissions.query) {
            return "function query() { [native code] }";
          }
          if (this === functionToString) {
            return nativeToStringFunctionString;
          }
          return oldCall.call(oldToString, this);
        }
        Function.prototype.toString = functionToString;
    });

    // Pass the Plugins Length Test.
    await page.evaluateOnNewDocument(() => {
      // Overwrite the `plugins` property to use a custom getter.
      Object.defineProperty(navigator, 'plugins', {
        // This just needs to have `length > 0` for the current test,
        // but we could mock the plugins too if necessary.
        get: () => [1, 2, 3, 4, 5]
      });
    });

    // Pass the Languages Test.
    await page.evaluateOnNewDocument(() => {
      // Overwrite the `plugins` property to use a custom getter.
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    });

    // Pass the iframe Test
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        get: function() {
          return window;
        }
      });
    });

    // Pass toString test, though it breaks console.debug() from working
    await page.evaluateOnNewDocument(() => {
      window.console.debug = () => {
        return null;
      };
    });
  }

  async launch(options) {
    console.log(this.options)

    this.options = merge(this.options, options)

    console.log(this.options)

    if (this.extras.allowFlash) {
      this.prefs = merge(this.prefs, PREFS.ALLOW_FLASH)
      if (!this.usesCustomBrowser && !this.hasFlashSettings) {
        console.warn(`When using builtin Chromium you need to additionally use puppeteer.setFlashSettings(path, version)`)
      }
      if (!this.usesCustomBrowser && this.hasFlashSettings) {
        this.options.args.push(`--ppapi-flash-path=${this.flashSettings.path}`)
        this.options.args.push(`--ppapi-flash-version=${this.flashSettings.version}`)
      }
    }

    if (this.hasUserPreferences) {
      console.assert(!this.options.headless, `Custom preferences can't be used in headless mode`);
      let userDataDir = this.options.userDataDir
      if (!userDataDir) {
        this.temporaryUserDataDir = await mkdtempAsync(CHROME_PROFILE_PATH);
        userDataDir = this.temporaryUserDataDir
      }
      const profileDefaultDir = userDataDir + '/Default';
      await mkdirpAsync(profileDefaultDir);
      await writeFileAsync(profileDefaultDir + '/Preferences', JSON.stringify(this.prefs));
      this.options.userDataDir = userDataDir
    }

    const browser = puppeteer.launch(this.options)
    browser.then(this.onLaunch.bind(this))
    return browser
  }

  cleanup() {
    if (!this.shouldCleanUp) {
      return
    }
    try {
      removeFolder.sync(this.temporaryUserDataDir);
    } catch (e) { }
  }

  onLaunch(browser) {
    this.browser = browser

    if (this.shouldCleanUp) {
      browser._process.once('close', this.cleanup.bind(this))
      process.on('exit', this.cleanup.bind(this))
      process.on('SIGINT', this.cleanup.bind(this))
      process.on('SIGTERM', this.cleanup.bind(this))
      process.on('SIGHUP', this.cleanup.bind(this))
    }

    const originalNewPage = browser.newPage
    browser.newPage = async () => {
      const page = await originalNewPage.apply(browser, arguments);
      await this.onNewPage(page)
      return page
    }

    browser.getExtensions = async () => {
      const targets = await browser.targets();
      const extensionTargets = targets.filter(({_targetInfo}) => {
        return _targetInfo.url.startsWith("chrome-extension://") && _targetInfo.type === 'background_page';
      }).map(et => {
        const res = et._targetInfo
        res.evaluate = async (expr, opts={awaitPromise: true, returnByValue: true, delay: 100}) => {
          const client = await et.createCDPSession()
          // There seems to be an occasional issue with extensions not initializing quickly enough
          // Add a small delay to ensure everything works as expected
          await delay(opts.delay)
          return await client.send('Runtime.evaluate', {
            expression: expr,
            awaitPromise: opts.awaitPromise,
            returnByValue: opts.returnByValue,
          })
        }
        return res
      })
      return extensionTargets
    }

  }

  async onNewPage(page) {
    if (this.extras.stealth) {
      await this.anonymizeUA(page)
      await this.enableDetectionEvasion(page)
    }

    // https://github.com/GoogleChrome/puppeteer/issues/1421
    page.clickAndWaitForNavigation = async (selector, clickOptions, waitOptions) => {
      const foo = await page.click(selector, clickOptions)
      console.log("clickAndWaitForNavigation", foo)
      return Promise.all([
        page.waitForNavigation(waitOptions),
        page.click(selector, clickOptions)
      ]).then((value) => {
        return value[0]
      })
    }
  }

  connect(options) {
    console.warn("Note: puppeteer.connect() is currently not augmented by puppeteer-extra")
    return puppeteer.connect(options);
  }

  executablePath() {
    return puppeteer.executablePath();
  }

  defaultArgs() {
    return puppeteer.defaultArgs();
  }


};
