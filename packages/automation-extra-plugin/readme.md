# automation-extra-plugin [![Build Status](https://travis-ci.org/berstend/puppeteer-extra.svg?branch=master)](https://travis-ci.org/berstend/puppeteer-extra) [![npm](https://img.shields.io/npm/v/automation-extra-plugin.svg)](https://www.npmjs.com/package/automation-extra-plugin)

## Installation

```bash
yarn add automation-extra-plugin
```

## WIP

New base plugin to support both Playwright and Puppeteer

## Differences

- Simpler API surface
- Removed crusty "data from plugins" logic
- Plugins don't register their own event listeners anymore (`_bindBrowserEvents` is gone), everything is called from the mother ship (`automation-extra`)
- TODO: A shim and utility functions will make writing agnostic plugins easier
