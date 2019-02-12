# puppeteer-extra-plugin [![Build Status](https://travis-ci.org/berstend/puppeteer-extra.svg?branch=master)](https://travis-ci.org/berstend/puppeteer-extra) [![npm](https://img.shields.io/npm/v/puppeteer-extra-plugin.svg)](https://www.npmjs.com/package/puppeteer-extra-plugin)

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

### `v3.0.1`

- Now written in TypeScript 🎉
- **Breaking change:** Now using a named export:

```js
// Before
const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

// After (>= v3.0.1)
const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
```
