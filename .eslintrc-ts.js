module.exports = {
  root: true,
  extends: [
    'standard-with-typescript',
    'prettier',
    'prettier/@typescript-eslint'
  ],
  ignorePatterns: ['dist/*', 'node_modules/*'],
  rules: {
    'lines-between-class-members': ['off']
  },
  // Typescript specific rules would throw when used with .js files
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname // https://github.com/typescript-eslint/typescript-eslint/issues/251
      },
      rules: {
        '@typescript-eslint/strict-boolean-expressions': [
          'warn',
          {
            allowNullableObject: true
          }
        ],
        '@typescript-eslint/lines-between-class-members': ['off'],
        '@typescript-eslint/explicit-function-return-type': ['off']
      }
    }
  ]
}
