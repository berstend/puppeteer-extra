/* global MimeType MimeTypeArray */

/**
 * Generate a convincing and functional MimeTypeArray (with mime types) from scratch.
 *
 * Note: This is meant to be run in the context of the page.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/mimeTypes
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MimeTypeArray
 */
module.exports.generateMimeTypeArray = (utils, fns) => mimeTypesData => {
  return fns.generateMagicArray(utils, fns)(
    mimeTypesData,
    MimeTypeArray.prototype,
    MimeType.prototype,
    'type'
  )
}
