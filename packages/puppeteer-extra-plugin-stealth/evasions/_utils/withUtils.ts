import { Page } from "puppeteer"
import utils from './index'

/**
 * Wrap a page with utilities.
 *
 * @param {Puppeteer.Page} page
 */
export = (page: Page ) => ({
  /**
   * Simple `page.evaluate` replacement to preload utils
   */
  evaluate: async function (mainFunction: any, ...args: any[]) {
    return page.evaluate(
      ({ _utilsFns, _mainFunction, _args }) => {
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
  evaluateOnNewDocument: async function (mainFunction: any, ...args: any[]) {
    return page.evaluateOnNewDocument(
      ({ _utilsFns, _mainFunction, _args }: { _utilsFns: any, _mainFunction: any, _args : string[]}) => {
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
  }
})
