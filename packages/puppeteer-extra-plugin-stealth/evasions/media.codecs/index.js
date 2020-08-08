'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
const args = require('../shared')

/**
 * Fix Chromium not reporting "probably" to codecs like `videoEl.canPlayType('video/mp4; codecs="avc1.42E01E"')`.
 * (Chromium doesn't support proprietary codecs, only Chrome does)
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/media.codecs'
  }

  async onPageCreated(page) {
    await page.evaluateOnNewDocument(args => {
      const utils = Object.fromEntries(
        Object.entries(args).map(([key, value]) => [key, eval(value)]) // eslint-disable-line no-eval
      )

      const { redefineFunction } = utils.getFunctionMockers(window)
      try {
        /**
         * Input might look funky, we need to normalize it so e.g. whitespace isn't an issue for our spoofing.
         *
         * @example
         * video/webm; codecs="vp8, vorbis"
         * video/mp4; codecs="avc1.42E01E"
         * audio/x-m4a;
         * audio/ogg; codecs="vorbis"
         * @param {String} arg
         */
        const parseInput = arg => {
          const [mime, codecStr] = arg.trim().split(';')
          let codecs = []
          if (codecStr && codecStr.includes('codecs="')) {
            codecs = codecStr
              .trim()
              .replace(`codecs="`, '')
              .replace(`"`, '')
              .trim()
              .split(',')
              .filter(x => !!x)
              .map(x => x.trim())
          }
          return { mime, codecStr, codecs }
        }

        /* global HTMLMediaElement */
        const oldCanPlayType = HTMLMediaElement.prototype.canPlayType
        redefineFunction(
          HTMLMediaElement.prototype,
          'canPlayType',
          function(target, thisArg, args) {
            const { mime, codecs } = parseInput(args[0])
            // This specific mp4 codec is missing in Chromium
            if (mime === 'video/mp4') {
              if (codecs.includes('avc1.42E01E')) {
                return 'probably'
              }
            }
            // This mimetype is only supported if no codecs are specified
            if (mime === 'audio/x-m4a' && !codecs.length) {
              return 'maybe'
            }

            // This mimetype is only supported if no codecs are specified
            if (mime === 'audio/aac' && !codecs.length) {
              return 'probably'
            }
            // Everything else as usual
            return oldCanPlayType.apply(this, args)
          },
          {
            isTrapStyle: true
          }
        )
      } catch (err) {}
    }, args)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
