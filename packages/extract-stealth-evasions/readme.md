# extract-stealth-evasions

This script offers a quick way to extract the latest stealth evasions from [puppeteer-extra-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) to (minified) JavaScript. The resulting JS file can be used in pure [CDP](https://chromedevtools.github.io/devtools-protocol/tot/) implementations or to test the evasions in your devtools.

#### How to use
```bash
yarn install
node .
```

Use the resulting `stealth.min.js` file however you like.

#### Options
```bash
$ node index -h
Usage: index [options]

Options:
  --version      Show version number                                   [boolean]
  -e, --exclude  Exclude evasion (repeat for multuple)
  -i, --include  Include evasion (repeat for multuple)
  -l, --list     List available evasions
  -h, --help     Show help                                             [boolean]
```