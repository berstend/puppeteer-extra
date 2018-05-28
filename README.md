# puppeteer-extra

## WIP

-   Tests needed
-   Improve a little on documentation
-   Implement missing plugins (stealth, flash)
-   Publish all the things



## Lerna

This is a monorepo powered by [Lerna](https://github.com/lerna/lerna).

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

# Update JSDoc based documentation in markdown files
yarn docs
```
