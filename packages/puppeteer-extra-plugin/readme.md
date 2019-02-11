# puppeteer-extra-plugin

## Installation

```bash
yarn add puppeteer-extra-plugin
```

Base class for `puppeteer-extra` plugins.

Provides convenience lifecycle methods to avoid boilerplate.

## API

I've refactored the code to TypeScript and the [generated typedoc API documentation can be found here](./docs).

Unfortunately the generated documentation is currently not as nice as the former documentation.js one but I'm working on it. :-)

## Changelog

### `v3.1.0`

- Now written in TypeScript 🎉
- **Breaking change:** Now using a named export:

```js
// Before
const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

// After (>= v3.1.0)
const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
```
