# extract-stealth-evasions

This script offers a quick way to extract the latest stealth evasions from [puppeteer-extra-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) to (minified) JavaScript. The resulting JS file can be used in pure [CDP](https://chromedevtools.github.io/devtools-protocol/tot/) implementations or to test the evasions in your devtools.

#### Usage with `npx`

You don't need to install anything, `npx` runs wherever NodeJS is installed. :-)

```bash
npx extract-stealth-evasions
```

Will create a `stealth.min.js` file in the current folder.

#### Using the CDN version

You can also fetch the latest version from [gitCDN](https://gitcdn.xyz/repo/berstend/puppeteer-extra/stealth-js/stealth.min.js). For example, paste this one-liner in your browser devtools console:

```js
document.body.appendChild(Object.assign(document.createElement('script'), {src: 'https://gitcdn.xyz/repo/berstend/puppeteer-extra/stealth-js/stealth.min.js'}))
```

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
  -h, --help     Show help                                             [boolean]
  -m, --minify   Minify the output                     [boolean] [default: true]
```