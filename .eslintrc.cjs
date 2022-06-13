module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "lines-between-class-members": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    // "max-len": ["warn", {code: 120, commentLength: 160, tabWidth: 2, ignoreUrls: true}]
  },
  "ignorePatterns": ["**/*.js"]
}
