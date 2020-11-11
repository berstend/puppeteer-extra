'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const withUtils = require('../_utils/withUtils')

const WEBGL_RENDERERS_DESKTOP = ['ANGLE (NVIDIA Quadro 2000M Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (NVIDIA Quadro K420 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA Quadro 2000M Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA Quadro K2000M Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (Intel(R) HD Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 3800 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (AMD Radeon R9 200 Series Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (Intel(R) HD Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 4000 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 3000 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Mobile Intel(R) 4 Series Express Chipset Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G33/G31 Express Chipset Family Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (Intel(R) Graphics Media Accelerator 3150 Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (Intel(R) G41 Express Chipset Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 6150SE nForce 430 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 4000)', 'ANGLE (Mobile Intel(R) 965 Express Chipset Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family)', 'ANGLE (NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (AMD Radeon HD 6310 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Graphics Media Accelerator 3600 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G33/G31 Express Chipset Family Direct3D9 vs_0_0 ps_2_0)', 'ANGLE (AMD Radeon HD 6320 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G33/G31 Express Chipset Family (Microsoft Corporation - WDDM 1.0) Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (Intel(R) G41 Express Chipset)', 'ANGLE (ATI Mobility Radeon HD 5470 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q45/Q43 Express Chipset Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 310M Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G41 Express Chipset Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (Mobile Intel(R) 45 Express Chipset Family (Microsoft Corporation - WDDM 1.1) Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 440 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 4300/4500 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7310 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics)', 'ANGLE (Intel(R) 4 Series Internal Chipset Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon(TM) HD 6480G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 3200 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7800 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G41 Express Chipset (Microsoft Corporation - WDDM 1.1) Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 210 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 630 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7340 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) 82945G Express Chipset Family Direct3D9 vs_0_0 ps_2_0)', 'ANGLE (NVIDIA GeForce GT 430 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 7025 / NVIDIA nForce 630a Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q35 Express Chipset Family Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (Intel(R) HD Graphics 4600 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7520G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD 760G (Microsoft Corporation WDDM 1.1) Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 220 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 9500 GT Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Graphics Media Accelerator HD Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 9800 GT Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q965/Q963 Express Chipset Family (Microsoft Corporation - WDDM 1.0) Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (NVIDIA GeForce GTX 550 Ti Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q965/Q963 Express Chipset Family Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (AMD M880G with ATI Mobility Radeon HD 4250 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GTX 650 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Mobility Radeon HD 5650 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 4200 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7700 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G33/G31 Express Chipset Family)', 'ANGLE (Intel(R) 82945G Express Chipset Family Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (SiS Mirage 3 Graphics Direct3D9Ex vs_2_0 ps_2_0)', 'ANGLE (NVIDIA GeForce GT 430)', 'ANGLE (AMD RADEON HD 6450 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon 3000 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) 4 Series Internal Chipset Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q35 Express Chipset Family (Microsoft Corporation - WDDM 1.0) Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (NVIDIA GeForce GT 220 Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7640G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD 760G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 6450 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 640 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 9200 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 610 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 6290 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Mobility Radeon HD 4250 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 8600 GT Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 5570 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 6800 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G45/G43 Express Chipset Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 4600 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA Quadro NVS 160M Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 3000)', 'ANGLE (NVIDIA GeForce G100)', 'ANGLE (AMD Radeon HD 8610G + 8500M Dual Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Mobile Intel(R) 4 Series Express Chipset Family Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 7025 / NVIDIA nForce 630a (Microsoft Corporation - WDDM) Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q965/Q963 Express Chipset Family Direct3D9 vs_0_0 ps_2_0)', 'ANGLE (AMD RADEON HD 6350 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 5450 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 9500 GT)', 'ANGLE (AMD Radeon HD 6500M/5600/5700 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Mobile Intel(R) 965 Express Chipset Family)', 'ANGLE (NVIDIA GeForce 8400 GS Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GTX 560 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 620 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GTX 660 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon(TM) HD 6520G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 240 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 8240 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA Quadro NVS 140M)', 'ANGLE (Intel(R) Q35 Express Chipset Family Direct3D9 vs_0_0 ps_2_0)'];
const WEBGL_VENDORS_ANDROID = ['Qualcomm', 'ARM'];
const WEBGL_RENDERERS_ANDROID = ['Adreno (TM) 630', 'Mali-T830'];

/**
 * Fix WebGL Vendor/Renderer being set to Google in headless mode
 *
 * Example data (Apple Retina MBP 13): {vendor: "Intel Inc.", renderer: "Intel(R) Iris(TM) Graphics 6100"}
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.vendor] - The vendor string to use (default: `Intel Inc.`)
 * @param {string} [opts.renderer] - The renderer string (default: `Intel Iris OpenGL Engine`)
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/webgl.vendor'
  }

  /* global WebGLRenderingContext WebGL2RenderingContext */
  async onPageCreated(page) {
    if (!this._session) {
      this._session = {};
      const userAgent = (await page.evaluate(() => navigator.userAgent)).toLowerCase();
      let vendor;
      if (userAgent.includes('ipad') || userAgent.includes('iphone') || userAgent.includes('macintosh')) {
        vendor = 'Apple Computer, Inc.';
      } else if (userAgent.includes('firefox')) {
        vendor = '';
      } else {
        vendor = 'Google Inc.';
      }
      const rand = function (min, max) {
        return Math.floor(Math.random() * (max - min) + min);
      };
      const randArr = function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
      };
      this._session['s7936'] = 'WebKit';
      this._session['s7937'] = 'WebKit WebGL';
      this._session['s7938'] = 'WebGL 2.0 (OpenGL ES 3.0 Chromium)';
      this._session['s35724'] = 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)';
      this._session['s36347'] = 4096;
      this._session['s36348'] = 30;
      this._session['s33902'] = [1, 1];
      this._session['s33901'] = [1, 1024];
      this._session['s6408'] = rand(6400, 6420);
      this._session['s35661'] = randArr([128, 192, 256]);
      this._session['s36349'] = Math.pow(2, rand(9, 12));
      this._session['s34852'] = 8;
      this._session['s3386'] = [32767, 32767];
      this._session['webgl2'] = true;
      if (userAgent.includes('(windows')) {
        this._session['s7936'] = 'Mozilla';
        this._session['s7937'] = 'Mozilla';
        this._session['s37445'] = this.opts.vendor || vendor;
        this._session['s37446'] = this.opts.renderer || WEBGL_RENDERERS_DESKTOP[Math.floor(Math.random() * WEBGL_RENDERERS_DESKTOP.length)];
      }
      else if (userAgent.includes('(android')) {
        this._session['s37445'] = this.opts.vendor || WEBGL_VENDORS_ANDROID[Math.floor(Math.random() * WEBGL_VENDORS_ANDROID.length)];
        this._session['s37446'] = this.opts.renderer || WEBGL_RENDERERS_ANDROID[Math.floor(Math.random() * WEBGL_RENDERERS_ANDROID.length)];
      }
      else if (userAgent.includes('(linux')) {
        this._session['s37445'] = this.opts.vendor || vendor;
        this._session['s37446'] = this.opts.renderer || WEBGL_RENDERERS_DESKTOP[Math.floor(Math.random() * WEBGL_RENDERERS_DESKTOP.length)];
      }
      else if (userAgent.includes('(iphone') || userAgent.includes('(ipad') || (userAgent.includes('(macintosh') && userAgent.includes('safari') && !userAgent.includes('chrome'))) {
        this._session['s7938'] = 'WebGL 1.0';
        this._session['s35724'] = 'WebGL GLSL ES 1.0 (1.0)';
        this._session['s37445'] = this.opts.vendor || 'Apple Inc.';
        this._session['s37446'] = this.opts.renderer || 'Apple GPU';
        this._session['s36347'] = 512;
        this._session['s36348'] = 15;
        this._session['s34852'] = 1;
        this._session['s33902'] = [1, 16];
        this._session['s33901'] = [1, 511];
        this._session['s3386'] = [16384, 16384];
        this._session['s36349'] = 224;
        this._session['s35661'] = 32;
        this._session['webgl2'] = false;
      }
      else if (userAgent.includes('(macintosh')) {
        this._session['s37445'] = this.opts.vendor || 'Intel Inc.';
        this._session['s37446'] = this.opts.renderer || 'Intel HD Graphics 4000 OpenGL Engine';
      }
      else {
        this._session['s37445'] = this.opts.vendor || vendor;
        this._session['s37446'] = this.opts.renderer || 'Google SwiftShader';
      }
      this._session['offset'] = Math.random();
    }
    await withUtils(page).evaluateOnNewDocument((utils, session) => {
      let safeOverwrite = (obj, prop, newVal) => {
        let props = Object.getOwnPropertyDescriptor(obj, prop);
        props["value"] = newVal;
        return props;
      }
      let paramChanges = {
        3379: 16384,
        3386: session['s3386'],
        3410: 8,
        3411: 8,
        3412: 8,
        3413: 8,
        3414: 24,
        3415: 8,
        6408: session['s6408'],
        34024: 16384,
        30476: 16384,
        34921: 16,
        34930: 16,
        35660: 16,
        35661: session['s35661'],
        36347: session['s36347'],
        36349: session['s36349'],
        7936: session['s7936'],
        7937: session['s7937'],
        37445: session['s37445'],
        37446: session['s37446'],
        7938: session['s7938'],
        35724: session['s35724'],
        36348: session['s36348'],
        33902: session['s33902'],
        33901: session['s33901'],
        34852: session['s34852']
      };
      let changeMap = Object.assign({}, paramChanges);
      ["WebGLRenderingContext", "WebGL2RenderingContext"].forEach(function (ctx) {
        if (!window[ctx]) return;

        // Modify getParameter
        let oldParam = window[ctx].prototype.getParameter;
        Object.defineProperty(window[ctx].prototype, "getParameter",
          safeOverwrite(window[ctx].prototype, "getParameter", function (param) {
            if (changeMap[param]) return changeMap[param];
            return oldParam.apply(this, arguments);
          })
        );

        // Modify bufferData (this updates the image hash)
        let oldBuffer = window[ctx].prototype.bufferData;
        Object.defineProperty(window[ctx].prototype, "bufferData",
          safeOverwrite(window[ctx].prototype, "bufferData", function () {
            for (let i = 0; i < arguments[1].length; i++) {
              arguments[1][i] += session['offset'] * 1e-3;
            }
            return oldBuffer.apply(this, arguments);
          })
        );
      });
      if (!session['webgl2']) {
        paramChanges = {};
        Object.getOwnPropertyNames(WebGL2RenderingContext).forEach(property => {
          if (Number.isInteger(WebGL2RenderingContext[property]) && WebGL2RenderingContext[property] > 0) {
            paramChanges[property] = undefined;
          }
        });
        let oldParam = WebGL2RenderingContext.prototype.getParameter;
        Object.defineProperty(WebGL2RenderingContext.prototype, "getParameter",
          safeOverwrite(WebGL2RenderingContext.prototype, "getParameter", function (param) {
            if (paramChanges[param]) return paramChanges[param];
            return oldParam.apply(this, arguments);
          })
        );
        WebGL2RenderingContext = undefined;
        HTMLCanvasElement.prototype.getContext = function (orig) {
          return function (type) {
            return !type.includes("webgl2") ? orig.apply(this, arguments) : null
          }
        }(HTMLCanvasElement.prototype.getContext)
        HTMLCanvasElement.prototype.getContext.toString = () => 'function getContext() { [native code] }';
      }
    }, this._session);
    // await withUtils(page).evaluateOnNewDocument((utils, opts) => {
    //   const getParameterProxyHandler = {
    //     apply: function (target, ctx, args) {
    //       const param = (args || [])[0]
    //       // UNMASKED_VENDOR_WEBGL
    //       if (param === 37445) {
    //         return opts.vendor || 'Intel Inc.' // default in headless: Google Inc.
    //       }
    //       // UNMASKED_RENDERER_WEBGL
    //       if (param === 37446) {
    //         return opts.renderer || 'Intel Iris OpenGL Engine' // default in headless: Google SwiftShader
    //       }
    //       return utils.cache.Reflect.apply(target, ctx, args)
    //     }
    //   }

    //   // There's more than one WebGL rendering context
    //   // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext#Browser_compatibility
    //   // To find out the original values here: Object.getOwnPropertyDescriptors(WebGLRenderingContext.prototype.getParameter)
    //   const addProxy = (obj, propName) => {
    //     utils.replaceWithProxy(obj, propName, getParameterProxyHandler)
    //   }
    //   // For whatever weird reason loops don't play nice with Object.defineProperty, here's the next best thing:
    //   addProxy(WebGLRenderingContext.prototype, 'getParameter')
    //   addProxy(WebGL2RenderingContext.prototype, 'getParameter')
    // }, this.opts)
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
