'use strict'

const util = require('util')
const fs = require('fs')
const fse = require('fs-extra')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')
const debug = require('debug')('puppeteer-extra-plugin:user-data-dir')
const mkdtempAsync = util.promisify(fs.mkdtemp)
const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 *
 * Further reading:
 * https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)

    this._userDataDir = null
    this._isTemporary = false

    const defaults = {
      deleteTemporary: true,
      deleteExisting: false,
      files: []
    }
    // Follow Puppeteers temporary user data dir naming convention by default
    defaults.folderPath = os.tmpdir()
    defaults.folderPrefix = 'puppeteer_dev_profile-'

    this._opts = Object.assign(defaults, opts)
    debug('initialized', this._opts)
  }

  get name() {
    return 'user-data-dir'
  }

  get requirements() {
    return new Set(['runLast', 'dataFromPlugins'])
  }

  get shouldDeleteDirectory() {
    if (this._isTemporary && this._opts.deleteTemporary) {
      return true
    }
    return this._opts.deleteExisting
  }

  get temporaryDirectoryPath() {
    return path.join(this._opts.folderPath, this._opts.folderPrefix)
  }

  get defaultProfilePath() {
    return path.join(this._userDataDir, 'Default')
  }

  async makeTemporaryDirectory() {
    this._userDataDir = await mkdtempAsync(this.temporaryDirectoryPath)
    this._isTemporary = true
  }

  deleteUserDataDir() {
    debug('removeUserDataDir', this._userDataDir)

    if (!this._userDataDir) {
      debug('No userDataDir, not running rimraf')
      return
    }

    // We're using rimraf here because it throw errors and don't seem to freeze the process
    // If ressources busy or locked by chrome try again 4 times, then give up. overall a timout of 400ms
    rimraf(
      this._userDataDir,
      {
        maxBusyTries: 4
      },
      err => {
        debug(err)
      }
    )
  }

  async writeFilesToProfile() {
    const filesFromPlugins = this.getDataFromPlugins('userDataDirFile').map(
      d => d.value
    )
    const files = [].concat(filesFromPlugins, this._opts.files)
    if (!files.length) {
      return
    }
    for (const file of files) {
      if (file.target !== 'Profile') {
        console.warn(`Warning: Ignoring file with invalid target`, file)
        continue
      }
      const filePath = path.join(this.defaultProfilePath, file.file)
      try {
        await fse.outputFile(filePath, file.contents)
        debug(`Wrote file`, filePath)
      } catch (err) {
        console.warn('Warning: Failure writing file', filePath, file, err)
      }
    }
  }

  async beforeLaunch(options) {
    this._userDataDir = options.userDataDir
    if (!this._userDataDir) {
      await this.makeTemporaryDirectory()
      options.userDataDir = this._userDataDir
      debug('created custom dir', options.userDataDir)
    }
    await this.writeFilesToProfile()
  }

  async onDisconnected() {
    debug('onDisconnected')
    if (this.shouldDeleteDirectory) {
      this.deleteUserDataDir()
    }
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
