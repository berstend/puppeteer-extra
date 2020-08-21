/* global Plugin PluginArray */

/**
 * Generate a convincing and functional PluginArray (with plugins) from scratch.
 *
 * Note: This is meant to be run in the context of the page.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/plugins
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PluginArray
 */
module.exports.generatePluginArray = (utils, fns) => pluginsData => {
  return fns.generateMagicArray(utils, fns)(
    pluginsData,
    PluginArray.prototype,
    Plugin.prototype,
    'name'
  )
}
