'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const withUtils = require('../_utils/withUtils')

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
    await withUtils(page).evaluateOnNewDocument(utils => {
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
        return {
          mime,
          codecStr,
          codecs
        }
      }

      const canPlayType = {
        // Intercept certain requests
        apply: function(target, ctx, args) {
          if (!args || !args.length) {
            return target.apply(ctx, args)
          }
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
          return target.apply(ctx, args)
        }
      }

      /* global HTMLMediaElement */
      utils.replaceWithProxy(
        HTMLMediaElement.prototype,
        'canPlayType',
        canPlayType
      )
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
