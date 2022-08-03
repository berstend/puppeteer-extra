import { PuppeteerPage } from 'puppeteer-extra-plugin'
import { utils } from './'

/**
 * Wrap a page with utilities.
 *
 * @param {Puppeteer.Page} page
 */
export const withUtils = (page: PuppeteerPage) => ({
  /**
   * Simple `page.evaluate` replacement to preload utils
   */
  evaluate: async function(mainFunction: Function, ...args: any[]) {
    return page.evaluate(
      ({ _utilsFns, _mainFunction, _args }: {_utilsFns: {[key: string]: string}, _mainFunction: string, _args: unknown[]}) => {
        // Add this point we cannot use our utililty functions as they're just strings, we need to materialize them first
        const utils = Object.fromEntries(
          Object.entries(_utilsFns).map(([key, value]) => [key, eval(value as string)]) // eslint-disable-line no-eval
        )
        utils.init()
        return eval(_mainFunction)(utils, ..._args) // eslint-disable-line no-eval
      },
      {
        _utilsFns: utils.stringifyFns(utils),
        _mainFunction: mainFunction.toString(),
        _args: args || []
      }
    )
  },
  /**
   * Simple `page.evaluateOnNewDocument` replacement to preload utils
   */
  evaluateOnNewDocument: async function(mainFunction: {[key: string]: any}, ...args: any[]) {
    return page.evaluateOnNewDocument(
      ({ _utilsFns, _mainFunction, _args }: {_utilsFns: {[key: string]: string}, _mainFunction: string, _args: unknown[]}) => {
        // Add this point we cannot use our utililty functions as they're just strings, we need to materialize them first
        const utils = Object.fromEntries(
          Object.entries(_utilsFns).map(([key, value]) => [key, eval(value)]) // eslint-disable-line no-eval
        )
        utils.init()
        return eval(_mainFunction)(utils, ..._args) // eslint-disable-line no-eval
      },
      {
        _utilsFns: utils.stringifyFns(utils),
        _mainFunction: mainFunction.toString(),
        _args: args || []
      }
    )
  }
})

export default withUtils;
