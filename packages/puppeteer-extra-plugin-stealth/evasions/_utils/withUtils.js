const utils = require('./index')

/**
 * Wrap a page with utilities.
 *
 * @param {Puppeteer.Page} page
 */
module.exports = page => ({
  /**
   * Simple `page.evaluate` replacement to preload utils
   */
  evaluate: async function(mainFunction, ...args) {
    return page.evaluate(
      ({ _utilsFns, _mainFunction, _args }) => {
        // Add this point we cannot use our utililty functions as they're just strings, we need to materialize them first
        const utils = Object.fromEntries(
          Object.entries(_utilsFns).map(([key, value]) => [key, eval(value)]) // eslint-disable-line no-eval
        )
        utils.preloadCache()
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
  evaluateOnNewDocument: async function(mainFunction, ...args) {
    return page.evaluateOnNewDocument(
      ({ _utilsFns, _mainFunction, _args }) => {
        // Add this point we cannot use our utililty functions as they're just strings, we need to materialize them first
        const utils = Object.fromEntries(
          Object.entries(_utilsFns).map(([key, value]) => [key, eval(value)]) // eslint-disable-line no-eval
        )
        utils.preloadCache()
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
