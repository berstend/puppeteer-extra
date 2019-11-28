# puppeteer-extra

This is the monorepo for [`puppeteer-extra`](./packages/puppeteer-extra), a modular plugin framework for [`puppeteer`](https://github.com/GoogleChrome/puppeteer). :-)

**For the main documentation, please head over to the [`puppeteer-extra`](./packages/puppeteer-extra) package.**

In case you're interested in the available plugins, check out the [packages folder](./packages/).

## Contributing

PRs and new plugins are welcome! :tada: The plugin API for `puppeteer-extra` is clean and fun to use. Have a look the [`PuppeteerExtraPlugin`](./packages/puppeteer-extra-plugin) base class documentation to get going and check out the [existing plugins](./packages/) (minimal example is the [anonymize-ua](./packages/puppeteer-extra-plugin-anonymize-ua/index.js) plugin) for reference.

We use a [monorepo](https://github.com/berstend/puppeteer-extra) powered by [Lerna](https://github.com/lerna/lerna#--use-workspaces) (and yarn workspaces), [ava](https://github.com/avajs/ava) for testing, the [standard](https://standardjs.com/) style for linting and [JSDoc](http://usejsdoc.org/about-getting-started.html) heavily to auto-generate markdown [documentation](https://github.com/documentationjs/documentation) based on code. :-)

## Lerna

This is monorepo is powered by [Lerna](https://github.com/lerna/lerna) and yarn workspaces.

#### Development flow

```bash
# Install deps
yarn

# Bootstrap the packages in the current Lerna repo.
# Installs all of their dependencies and links any cross-dependencies.
yarn bootstrap

# Install debug in all packages
yarn lerna add debug

# Install fs-extra to puppeteer-extra-plugin-user-data-dir
yarn lerna add fs-extra --scope=puppeteer-extra-plugin-user-data-dir

# Remove dependency
# https://github.com/lerna/lerna/issues/833
yarn lerna exec --concurrency 1 'yarn remove fs-extra; echo 0'

# Run test in all packages
yarn test

# Update JSDoc based documentation in markdown files
yarn docs

# Upgrade project wide deps like puppeteer
# (We keep the devDependency version blurry with @next)
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
