import { PuppeteerExtraPlugin, PuppeteerPage } from 'puppeteer-extra-plugin'
import { withUtils } from '../_utils/withUtils'
import Utils from '../_utils/'

export interface PluginOptions {
}

/**
 * Fix Chromium not reporting "probably" to codecs like `videoEl.canPlayType('video/mp4; codecs="avc1.42E01E"')`.
 * (Chromium doesn't support proprietary codecs, only Chrome does)
 */
 export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'stealth/evasions/media.codecs' {
    return 'stealth/evasions/media.codecs'
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    await withUtils(page).evaluateOnNewDocument((utils: typeof Utils) => {
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
        const parseInput = (arg: string): { mime: string, codecStr: string, codecs: string[] } => {
        const [mime, codecStr] = arg.trim().split(';')
        let codecs: string[] = []
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
        apply: function(target: any, ctx: any, args: string[]) {
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

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
