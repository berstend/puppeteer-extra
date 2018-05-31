# puppeteer-extra


This is the monorepo for [`puppeteer-extra`](./packages/puppeteer-extra), a modular plugin framework for [`puppeteer`](https://github.com/GoogleChrome/puppeteer). :-)

**For the main documentation, please head over to the [`puppeteer-extra`](./packages/puppeteer-extra) package.**


In case you're interested in the available plugins, check out the [packages folder](./packages/).




## Contributing

PRs and new plugins are welcome! The plugin API for `puppeteer-extra` is clean and fun to use. Have a look the [`PuppeteerExtraPlugin`](./packages/puppeteer-extra-plugin) base class documentation to get going and check out the [existing plugins](./packages/) for reference. 

We use the [`standard`](https://standardjs.com/) style for linting and [JSDoc](http://usejsdoc.org/about-getting-started.html) heavily to [auto-generate](https://github.com/transitive-bullshit/update-markdown-jsdoc) markdown documentation based on code. :-)



## Lerna

This is monorepo is powered by [Lerna](https://github.com/lerna/lerna) and yarn workspaces.

#### Development flow

```bash
# Bootstrap the packages in the current Lerna repo. 
# Installs all of their dependencies and links any cross-dependencies.
yarn bootstrap

# Install debug in all modules
lerna add debug

# Install fs-extra to puppeteer-extra-plugin-user-data-dir
lerna add fs-extra --scope=puppeteer-extra-plugin-user-data-dir

# Remove dependency
# https://github.com/lerna/lerna/issues/833
lerna exec -- yarn remove fs-extra

# Run test in all packages
yarn test

# Run end-to-end/integration tests
# Note: This will launch browsers, etc.
yarn end-to-end-tests

# Update JSDoc based documentation in markdown files
yarn docs
```
