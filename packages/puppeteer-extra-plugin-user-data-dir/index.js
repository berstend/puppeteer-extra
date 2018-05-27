'use strict'

const util = require('util')
const fs = require('fs')
const fse = require('fs-extra')
const os = require('os')
const path = require('path')
const debug = require('debug')('puppeteer-extra-plugin:user-data-dir')

const mkdtempAsync = util.promisify(fs.mkdtemp)

const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

/**
 *
 * Further reading:
 * https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = { }) {
    super(opts)

    this._userDataDir = null
    this._isTemporary = false

    const defaults = {
      deleteTemporary: true,
      deleteExisting: false
    }
    // Follow Puppeteers temporary user data dir naming convention by default
    defaults.folderPath = os.tmpdir()
    defaults.folderPrefix = 'puppeteer_dev_profile-'

    this._opts = Object.assign(defaults, opts)
    debug('initialized', this._opts)
  }

  get name () {
    return 'user-data-dir'
  }

  get shouldDeleteDirectory () {
    if (this._isTemporary && this._opts.deleteTemporary) {
      return true
    }
    return this._opts.deleteExisting
  }

  get temporaryDirectoryPath () {
    return path.join(this._opts.folderPath, this._opts.folderPrefix)
  }

  get defaultProfilePath () {
    return path.join(this._userDataDir, 'Default')
  }

  async makeTemporaryDirectory () {
    this._userDataDir = await mkdtempAsync(this.temporaryDirectoryPath)
    this._isTemporary = true
  }

  deleteUserDataDir () {
    debug('removeUserDataDir')
    try {
      // We're doing it sync to improve chances to cleanup
      // correctly in the event of ultimate disaster.
      fse.removeSync(this._userDataDir)
    } catch (e) {
      debug(e)
    }
  }

  async writeFilesToProfile () {
    debug('writeFilesToProfile', this.puppeteer.files.length)
    const files = this.puppeteer.files.filter(f => f.target === 'Profile')
    if (!files.length) { return }
    for (const file of files) {
      const filePath = path.join(this.defaultProfilePath, file.file)
      try {
        await fse.outputFile(filePath, file.contents)
        debug(`Wrote file`, filePath)
      } catch (err) {
        console.warn('Warning: Failure writing file', filePath, file, err)
      }
    }
  }

  async beforeLaunch (options) {
    debug('beforeLaunch', {options})
    this._userDataDir = options.userDataDir
    if (!this._userDataDir) {
      await this.makeTemporaryDirectory()
      options.userDataDir = this._userDataDir
      debug('created custom dir', {options})
    }
    await this.writeFilesToProfile()
  }

  async onClose () {
    debug('onClose')
    if (this.shouldDeleteDirectory) {
      this.deleteUserDataDir()
    }
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
