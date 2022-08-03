/* eslint-disable */
// imported from: https://bot.sannysoft.com/fpScanner.js
// imported date: 2022-06-09

const parser = UAParser;

const fpscanner = (function () {
  const TESTS = {
    PHANTOM_UA: 'PHANTOM_UA',
    PHANTOM_PROPERTIES: 'PHANTOM_PROPERTIES',
    PHANTOM_ETSL: 'PHANTOM_ETSL',
    PHANTOM_LANGUAGE: 'PHANTOM_LANGUAGE',
    PHANTOM_WEBSOCKET: 'PHANTOM_WEBSOCKET',
    MQ_SCREEN: 'MQ_SCREEN',
    PHANTOM_OVERFLOW: 'PHANTOM_OVERFLOW',
    PHANTOM_WINDOW_HEIGHT: 'PHANTOM_WINDOW_HEIGHT',
    HEADCHR_UA: 'HEADCHR_UA',
    WEBDRIVER: 'WEBDRIVER',
    HEADCHR_CHROME_OBJ: 'HEADCHR_CHROME_OBJ',
    HEADCHR_PERMISSIONS: 'HEADCHR_PERMISSIONS',
    HEADCHR_PLUGINS: 'HEADCHR_PLUGINS',
    HEADCHR_IFRAME: 'HEADCHR_IFRAME',
    CHR_DEBUG_TOOLS: 'CHR_DEBUG_TOOLS',
    SELENIUM_DRIVER: 'SELENIUM_DRIVER',
    CHR_BATTERY: 'CHR_BATTERY',
    CHR_MEMORY: 'CHR_MEMORY',
    TRANSPARENT_PIXEL: 'TRANSPARENT_PIXEL',
    SEQUENTUM: 'SEQUENTUM',
    VIDEO_CODECS: 'VIDEO_CODECS'
  };

  const VENDORS = {
    ONEPLUS: 'OnePlus'
  };

  const BROWSERS = {
    CHROME: 'Chrome',
    CHROMIUM: 'Chromium',
    OPERA: 'Opera'
  };

  // TODO adds test for memoryDevices > 8 except for  'ONEPLUS'

  const INCONSISTENT = 1;
  const UNSURE = 2;
  const CONSISTENT = 3;

  const analysisResult = (name, consistent, data) => {
    return {name: name, consistent: consistent, data: data};
  };

  const analyseFingerprint = (fingerprint) => {
    const detectionTests = {};

    const uaParsed = parser(fingerprint.userAgent);
    const OS_REF = uaParsed.os.name;
    const OS_VERSION_REF = uaParsed.os.version;
    const BROWSER_REF = uaParsed.browser.name;
    const BROWSER_VERSION_REF = uaParsed.browser.major;
    const IS_MOBILE_REF = uaParsed.device.type === parser.DEVICE.MOBILE;
    const VENDOR_REF = uaParsed.device.vendor;

    const addTestResult = (fn) => {
      let result = fn(fingerprint);
      detectionTests[result.name] = result;
    };

    // Add tests below:
    addTestResult(() => {
      const testResult = /PhantomJS/.test(fingerprint.userAgent) ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.PHANTOM_UA, testResult, {userAgent: fingerprint.userAgent});
    });

    addTestResult(() => {
      const testResult = fingerprint.phantomJS.some((val) => {
        return val;
      }) ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.PHANTOM_PROPERTIES, testResult, {attributesFound: fingerprint.phantomJS});
    });

    addTestResult(() => {
      let testResult = !/Firefox/.test(fingerprint.userAgent) && !/Safari/.test(BROWSER_REF) &&
      fingerprint.etsl === 37 ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.PHANTOM_ETSL, testResult, {etsl: fingerprint.etsl});
    });

    addTestResult(() => {
      let testResult = !/Trident|MSIE|Edge/.test(fingerprint.userAgent) &&
      fingerprint.languages === undefined ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.PHANTOM_LANGUAGE, testResult, {languages: fingerprint.languages});
    });

    addTestResult(() => {
      let testResult = /SyntaxError: DOM Exception 12/.test(fingerprint.errorsGenerated[7]) ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.PHANTOM_WEBSOCKET, testResult, {error: fingerprint.errorsGenerated[7]});
    });

    addTestResult(() => {
      let testResult = fingerprint.screenMediaQuery ? CONSISTENT : INCONSISTENT;
      return analysisResult(TESTS.MQ_SCREEN, testResult, {});
    });

    addTestResult(() => {
      let testResult = fingerprint.resOverflow.errorName === 'RangeError' &&
      fingerprint.resOverflow.errorMessage === 'Maximum call stack size exceeded.' &&
      fingerprint.resOverflow.errorStacklength > 20 * fingerprint.resOverflow.depth ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.PHANTOM_OVERFLOW, testResult, fingerprint.resOverflow)
    });

    addTestResult(() => {
      let testResult = fingerprint.screen.sAvailWidth <= fingerprint.screen.sWidth &&
      fingerprint.screen.sAvailHeight <= fingerprint.screen.sHeight ? CONSISTENT : INCONSISTENT;
      return analysisResult(TESTS.PHANTOM_WINDOW_HEIGHT, testResult, fingerprint.screen);
    });

    addTestResult(() => {
      let testResult = /HeadlessChrome/.test(fingerprint.userAgent) ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.HEADCHR_UA, testResult, {userAgent: fingerprint.userAgent});
    });

    addTestResult(() => {
      let testResult;
      if (/Chrome/.test(fingerprint.userAgent)) {
        testResult = fingerprint.webDriver ? INCONSISTENT : CONSISTENT;
      } else {
        // Safari, Firefox have a webriver, but it is set to false
        testResult = fingerprint.webDriver && fingerprint.webDriverValue ? INCONSISTENT : CONSISTENT;
      }
      return analysisResult(TESTS.WEBDRIVER, testResult, {});
    });

    addTestResult(() => {
      let testResult = !fingerprint.hasChrome && /Chrome|Chromium/.test(BROWSER_REF) ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.HEADCHR_CHROME_OBJ, testResult, {});
    });

    addTestResult(() => {
      let testResult = fingerprint.permissions.permission === 'denied' &&
      fingerprint.permissions.state === 'prompt' ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.HEADCHR_PERMISSIONS, testResult, {});
    });

    addTestResult(() => {
      let testResult = /Chrome/.test(fingerprint.userAgent) &&
      fingerprint.plugins.length === 0 ? UNSURE : CONSISTENT;
      return analysisResult(TESTS.HEADCHR_PLUGINS, testResult, {plugins: fingerprint.plugins});
    });

    addTestResult(() => {
      let testResult = /Chrome/.test(fingerprint.userAgent) &&
      fingerprint.iframeChrome === 'undefined' ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.HEADCHR_IFRAME, testResult, {});
    });

    addTestResult(() => {
      let testResult = /Chrome/.test(fingerprint.userAgent) &&
      fingerprint.debugTool ? UNSURE : CONSISTENT;
      return analysisResult(TESTS.CHR_DEBUG_TOOLS, testResult, {});
    });

    addTestResult(() => {
      const testResult = fingerprint.selenium.some((val) => {
        return val;
      }) ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.SELENIUM_DRIVER, testResult, {attributesFound: fingerprint.selenium});
    });

    addTestResult(() => {
      let testResult = /Chrome/.test(fingerprint.userAgent) &&
      BROWSER_VERSION_REF > 49 && !fingerprint.battery ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.CHR_BATTERY, testResult, {});
    });

    addTestResult(() => {
      let testResult = CONSISTENT;

      if (fingerprint.deviceMemory !== 0 &&
        !(BROWSER_REF === BROWSERS.CHROME && BROWSER_VERSION_REF >= 63) &&
        !(/Opera/.test(BROWSER_REF) && BROWSER_VERSION_REF >= 50)) {
        // If deviceMemory != 0 and not recent Chrome or Opera
        testResult = INCONSISTENT;
      } else if (fingerprint.deviceMemory === 0 &&
        ((BROWSER_REF === BROWSERS.CHROME && BROWSER_VERSION_REF >= 63) ||
          (/Opera/.test(BROWSER_REF) && BROWSER_VERSION_REF >= 50))) {
        // If deviceMemory = 0 and recent Chrome or Opera
        testResult = INCONSISTENT;
      }

      return analysisResult(TESTS.CHR_MEMORY, testResult, {});
    });

    addTestResult(() => {
      let testResult = fingerprint.tpCanvas !== 'error' &&
      fingerprint.tpCanvas[0] === 0 &&
      fingerprint.tpCanvas[1] === 0 &&
      fingerprint.tpCanvas[2] === 0 &&
      fingerprint.tpCanvas[3] === 0 ? CONSISTENT : UNSURE;
      return analysisResult(TESTS.TRANSPARENT_PIXEL, testResult, fingerprint.tpCanvas);
    });

    addTestResult(() => {
      let testResult = fingerprint.sequentum ? INCONSISTENT : CONSISTENT;
      return analysisResult(TESTS.SEQUENTUM, testResult, {});
    });


    // TODO: do more tests on Windows and Mac OS to change UNSURE to INCONSISTENT
    addTestResult(() => {
      let testResult = (BROWSER_REF === BROWSERS.CHROME || BROWSER_REF === BROWSERS.CHROMIUM) &&
      fingerprint.videoCodecs.h264 !== 'probably' ? UNSURE : CONSISTENT;
      return analysisResult(TESTS.VIDEO_CODECS, testResult, {h264: fingerprint.videoCodecs.h264});
    });

    return detectionTests;
  };

  return {
    analyseFingerprint: analyseFingerprint,
    CONSISTENT: CONSISTENT,
    UNSURE: UNSURE,
    INCONSISTENT: INCONSISTENT,
    TESTS: TESTS
  }
})();