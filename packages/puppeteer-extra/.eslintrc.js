module.exports = {
  extends: [
    'standard-with-typescript',
    'prettier',
    'prettier/@typescript-eslint'
  ],
  parserOptions: {
    project: 'tsconfig.eslint.json',
    sourceType: 'module',
    tsconfigRootDir: __dirname // https://github.com/typescript-eslint/typescript-eslint/issues/251
  },
  ignorePatterns: ['dist/*'],
  rules: {}
}
