const pkg = require('./package.json')

const isIncompatiblePuppeteerVersion = () => {
  const version = pkg.devDependencies.puppeteer
  const majorVersion = parseInt(version.split('.')[0])
  return majorVersion >= 6;
}

const incompatible = isIncompatiblePuppeteerVersion()
if (incompatible) {
  console.warn(
    'ERR: The sessionPersistence plugin requires pptr >= 6',
    process.env.PUPPETEER_VERSION
  )
}
