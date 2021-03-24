import { CDPSession, Page } from 'puppeteer'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

interface SourceurlPluginOption {}

/**
 * Strip sourceURL from scripts injected by puppeteer.
 * It can be used to identify the presence of pptr via stacktraces.
 */
class SourceurlPlugin extends PuppeteerExtraPlugin {
  constructor(opts: Partial<SourceurlPluginOption> = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/sourceurl'
  }

  async onPageCreated(page: Page) {
    if (!page) {
      this.debug('Warning, missing properties to intercept CDP.', { page })
      return
    }
    const client = (page as any)._client as CDPSession;
    if (!client || !client.send) {
      this.debug('Warning, missing properties to intercept CDP.', { page })
      return
    }

    // Intercept CDP commands and strip identifying and unnecessary sourceURL
    // https://github.com/puppeteer/puppeteer/blob/9b3005c105995cd267fdc7fb95b78aceab82cf0e/new-docs/puppeteer.cdpsession.md
    const debug = this.debug
    client.send = (function(originalMethod: Function, context) {
      return async function() {
        const [method, paramArgs] = arguments || []
        const next = () => originalMethod.apply(context, [method, paramArgs])

        if (!method || !paramArgs) {
          return next()
        }

        // To find the methods/props in question check `_evaluateInternal` at:
        // https://github.com/puppeteer/puppeteer/blob/main/src/common/ExecutionContext.ts#L186
        const methodsToPatch = {
          'Runtime.evaluate': 'expression',
          'Runtime.callFunctionOn': 'functionDeclaration'
        } as {[key: string]: string}
        const SOURCE_URL_SUFFIX =
          '//# sourceURL=__puppeteer_evaluation_script__'

        if (!methodsToPatch[method] || !paramArgs[methodsToPatch[method]]) {
          return next()
        }

        debug('Stripping sourceURL', { method })
        paramArgs[methodsToPatch[method]] = paramArgs[
          methodsToPatch[method]
        ].replace(SOURCE_URL_SUFFIX, '')

        return next()
      }
    })(client.send, client)
  }
}

export = function(pluginConfig: Partial<SourceurlPluginOption>) {
  return new SourceurlPlugin(pluginConfig)
}
