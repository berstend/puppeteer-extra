# extract-stealth-evasions

This script offers a quick way to extract the latest stealth evasions from [puppeteer-extra-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) to (minified) JavaScript. The resulting JS file can be used in pure [CDP](https://chromedevtools.github.io/devtools-protocol/tot/) implementations or to test the evasions in your devtools.

#### Usage with `npx`

You don't need to install anything, `npx` runs wherever NodeJS is installed. :-)

```bash
npx extract-stealth-evasions
```

Will create a `stealth.min.js` file in the current folder.

#### How to use locally

```bash
yarn install
node index.js
```

Use the resulting `stealth.min.js` file however you like.

#### Options

```bash
$ npx extract-stealth-evasions -h
Usage: extract-stealth-evasions [options]

Options:
  --version      Show version number                                   [boolean]
  -e, --exclude  Exclude evasion (repeat for multiple)
  -i, --include  Include evasion (repeat for multiple)
  -l, --list     List available evasions
  -h, --help     Show help                                             [boolean]                                          [boolean]
```