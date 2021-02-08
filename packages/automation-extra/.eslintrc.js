const config = require('../../.eslintrc-ts')
// https://github.com/typescript-eslint/typescript-eslint/issues/251
config.overrides[0].parserOptions.tsconfigRootDir = __dirname
module.exports = config
