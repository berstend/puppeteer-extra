const pkg = require('./package.json')

const isIncompatiblePuppeteerVersion = () => {
  const version = pkg.devDependencies.puppeteer
  const majorVersion = parseInt(version.split('.')[0])
  if (majorVersion >= 6) {
    return true
  } else {
    return false
  }
}

const incompatible = isIncompatiblePuppeteerVersion()
if (incompatible) {
  console.warn(
    'ERR: The adblocker plugin requires pptr >= 6',
    process.env.PUPPETEER_VERSION
  )
}
