# puppeteer-extra

This is the monorepo for [`puppeteer-extra`](./packages/puppeteer-extra), a modular plugin framework for [`puppeteer`](https://github.com/puppeteer/puppeteer). :-)

🌟 **For the main documentation, please head over to the [`puppeteer-extra`](./packages/puppeteer-extra) package.**

We've also recently introduced support for Playwright, if you're interested in that head over to [`playwright-extra`](./packages/playwright-extra).

## Monorepo

<details>
 <summary><strong>Contributing</strong></summary>

### Contributing

PRs and new plugins are welcome! The plugin API for `puppeteer-extra` is clean and fun to use. Have a look the [`PuppeteerExtraPlugin`](./packages/puppeteer-extra-plugin) base class documentation to get going and check out the [existing plugins](./packages/) (minimal example is the [anonymize-ua](./packages/puppeteer-extra-plugin-anonymize-ua/index.js) plugin) for reference.

We use a [monorepo](https://github.com/berstend/puppeteer-extra) powered by [Lerna](https://github.com/lerna/lerna#--use-workspaces) (and yarn workspaces), [ava](https://github.com/avajs/ava) for testing, the [standard](https://standardjs.com/) style for linting and [JSDoc](http://usejsdoc.org/about-getting-started.html) heavily to auto-generate markdown [documentation](https://github.com/documentationjs/documentation) based on code. :-)

</details>

<details>
 <summary><strong>Lerna</strong></summary>

### Lerna

This monorepo is powered by [Lerna](https://github.com/lerna/lerna) and yarn workspaces.

#### Initial setup

- Make sure to have a recent Node.js version installed (hint: use `nvm`)
- Make sure `yarn` is recent (`>=1.2`), for better workspace support:

```bash
rm -rf ~/.yarn && npm install --global yarn && yarn --version
# Issues? Check your PATH and `which yarn`
```

```bash
# Install deps
yarn

# Bootstrap the packages in the current Lerna repo.
# Installs all of their dependencies and links any cross-dependencies.
yarn bootstrap

# Build all TypeScript sources
yarn build
```

#### Development flow

```bash
# Install debug in all packages
yarn lerna add debug

# Install fs-extra to puppeteer-extra-plugin-user-data-dir
yarn lerna add fs-extra --scope=puppeteer-extra-plugin-user-data-dir

# Remove dependency
# https://github.com/lerna/lerna/issues/833
yarn lerna exec --concurrency 1 'yarn remove fs-extra; echo 0'

# Make sure firefox is installed and symlinked
yarn download-firefox

# Run test in all packages
yarn test

# Update JSDoc based documentation in markdown files
yarn docs

# Upgrade project wide deps like puppeteer
# (We keep the devDependency version blurry)
rm -rf node_modules
rm -rf yarn.lock
yarn
yarn lerna bootstrap

# Update deps within packages (interactive)
yarn lernaupdate

# If in doubt :-(
yarn lerna exec "rm -f yarn.lock; rm -rf node_modules; echo 0"
rm -f yarn.lock &&  rm -rf node_modules && yarn cache clean
```

#### Publishing

```bash
# make sure you're signed into npm before publishing
# yarn publishing is broken so lerna uses npm
npm whoami

# ensure everything is up2date and peachy
yarn
yarn bootstrap
yarn lerna link
yarn build
yarn test

# Phew, let's publish these packages!
# - Will publish all changed packages
# - Will ask for new pkg version per package
# - Will updated inter-package dependency versions automatically
yarn lerna publish

# Fix new dependency version symlinks
yarn bootstrap && yarn lerna link
```

</details>

<br>
<p align="center">
  <img src="https://i.imgur.com/EuqiF5F.png"  height="240"  />
</p>
