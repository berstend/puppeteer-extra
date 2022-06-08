'use strict'

import util from 'util'
import fs from 'fs'
import fse from 'fs-extra'
import os from 'os'
import path from 'path'
import Debug from 'debug'

const debug = Debug('puppeteer-extra-plugin:user-data-dir')
const mkdtempAsync = util.promisify(fs.mkdtemp)
import { PuppeteerExtraPlugin, PluginRequirements, PuppeteerLaunchOption } from 'puppeteer-extra-plugin'

export interface PluginOptions {
  deleteTemporary: boolean;
  deleteExisting: boolean;
  folderPath: string;
  folderPrefix: string;
  files: Array<{target: string}>;
}

/**
 *
 * Further reading:
 * https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md
 */
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  private _userDataDir = '';
  private _isTemporary = false;

  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
    debug('initialized', this.opts)
  }

  get defaults(): PluginOptions {
    // Follow Puppeteers temporary user data dir naming convention by default
    return {
      deleteTemporary: true,
      deleteExisting: false,
      folderPath: os.tmpdir(),
      folderPrefix: 'puppeteer_dev_profile-',
      files: []
    }
  }

  get name(): 'user-data-dir' {
    return 'user-data-dir'
  }

  get requirements(): PluginRequirements {
    return new Set(['runLast', 'dataFromPlugins'])
  }

  get shouldDeleteDirectory(): boolean {
    if (this._isTemporary && this.opts.deleteTemporary) {
      return true
    }
    return this.opts.deleteExisting
  }

  get temporaryDirectoryPath(): string {
    return path.join(this.opts.folderPath, this.opts.folderPrefix)
  }

  get defaultProfilePath(): string {
    return path.join(this._userDataDir, 'Default')
  }

  async makeTemporaryDirectory(): Promise<void> {
    this._userDataDir = await mkdtempAsync(this.temporaryDirectoryPath)
    this._isTemporary = true
  }

  deleteUserDataDir(): void {
    debug('removeUserDataDir', this._userDataDir)
    try {
      // We're doing it sync to improve chances to cleanup
      // correctly in the event of ultimate disaster.
      if ('rmSync' in fs) {
        // Only available in node >= v14.14.0
        fs.rmSync(this._userDataDir, {
          recursive: true,
          force: true, // exceptions will be ignored if path does not exist
          maxRetries: 3
        })
      } else {
        // Deprecated since node >= v14.14.0
        fs.rmdirSync(this._userDataDir, {
          recursive: true,
          maxRetries: 3
        })
      }
    } catch (e) {
      debug(e)
    }
  }

  async writeFilesToProfile(): Promise<void> {
    const filesFromPlugins: any[] = this.getDataFromPlugins('userDataDirFile').map(
      d => d.value
    )
    const files: Array<{target: string, file: string, contents: any}> = [].concat(filesFromPlugins as any, this.opts.files as any)
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

  async beforeLaunch(options: PuppeteerLaunchOption = {}): Promise<void | PuppeteerLaunchOption> {
    this._userDataDir = options.userDataDir || ''
    if (!this._userDataDir) {
      await this.makeTemporaryDirectory()
      options.userDataDir = this._userDataDir
      debug('created custom dir', options.userDataDir)
    }
    await this.writeFilesToProfile()
  }

  async onDisconnected(): Promise<void> {
    debug('onDisconnected')
    if (this.shouldDeleteDirectory) {
      this.deleteUserDataDir()
    }
  }
}

export default (pluginConfig?: Partial<PluginOptions>) =>new Plugin(pluginConfig)
