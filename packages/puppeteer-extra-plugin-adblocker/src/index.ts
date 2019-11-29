import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import { PuppeteerBlocker } from '@cliqz/adblocker-puppeteer'
import fetch from 'node-fetch'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

const pkg = require('../package.json')
const engineCacheFilename = `${pkg.name}-${pkg.version}-engine.bin`

/** Available plugin options */
export interface PluginOptions {
  /** Whether or not to block trackers (in addition to ads). Default: false */
  blockTrackers: boolean
  /** Persist adblocker engine cache to disk for speedup. Default: true */
  useCache: boolean
  /** Optional custom directory for adblocker cache files. Default: undefined */
  cacheDir?: string
}

/**
 * A puppeteer-extra plugin to automatically block ads and trackers.
 */
export class PuppeteerExtraPluginAdblocker extends PuppeteerExtraPlugin {
  private blocker: PuppeteerBlocker | undefined

  constructor(opts: Partial<PluginOptions>) {
    super(opts)
    this.debug('Initialized', this.opts)
  }

  get name() {
    return 'adblocker'
  }

  get defaults(): PluginOptions {
    return {
      blockTrackers: false,
      useCache: true,
      cacheDir: undefined
    }
  }

  get engineCacheFile() {
    const cacheDir = this.opts.cacheDir || os.tmpdir()
    return path.join(cacheDir, engineCacheFilename)
  }

  /**
   * Cache an instance of `PuppeteerBlocker` to disk if 'cacheDir' option was
   * specified for the plugin. It can then be used the next time this plugin is
   * used to load the adblocker faster.
   */
  private async persistToCache(blocker: PuppeteerBlocker): Promise<void> {
    if (!this.opts.useCache) {
      return
    }
    this.debug('persist to cache', this.engineCacheFile)
    await fs.writeFile(this.engineCacheFile, blocker.serialize())
  }

  /**
   * Initialize instance of `PuppeteerBlocker` from cache if possible.
   * Otherwise, it throws and we will try to initialize it from remote instead.
   */
  private async loadFromCache(): Promise<PuppeteerBlocker> {
    if (!this.opts.useCache) {
      throw new Error('caching disabled')
    }
    this.debug('load from cache', this.engineCacheFile)
    return PuppeteerBlocker.deserialize(
      new Uint8Array(await fs.readFile(this.engineCacheFile))
    )
  }

  /**
   * Initialize instance of `PuppeteerBlocker` from remote (either by fetching
   * a serialized version of the engine when available, or by downloading raw
   * lists for filters such as EasyList then parsing them to initialize
   * blocker).
   */
  private async loadFromRemote(): Promise<PuppeteerBlocker> {
    this.debug('load from remote', { blockTrackers: this.opts.blockTrackers })
    if (this.opts.blockTrackers === true) {
      return PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch)
    } else {
      return PuppeteerBlocker.fromPrebuiltAdsOnly(fetch)
    }
  }

  /**
   * Return instance of `PuppeteerBlocker`. It will take care of initializing
   * it if necessary (first time it is called), or return the existing instance
   * if it already exists.
   */
  async getBlocker(): Promise<PuppeteerBlocker> {
    this.debug('getBlocker', { hasBlocker: !!this.blocker })
    if (this.blocker === undefined) {
      try {
        this.blocker = await this.loadFromCache()
      } catch (ex) {
        this.blocker = await this.loadFromRemote()
        await this.persistToCache(this.blocker)
      }
    }
    return this.blocker
  }

  /**
   * Hook into this blocking event to make sure the cache is initialized before navigation.
   */
  async beforeLaunch() {
    this.debug('beforeLaunch')
    await this.getBlocker()
  }

  /**
   * Hook into this blocking event to make sure the cache is initialized before navigation.
   */
  async beforeConnect() {
    this.debug('beforeConnect')
    await this.getBlocker()
  }

  /**
   * Enable adblocking in `page`.
   */
  async onPageCreated(page: any) {
    this.debug('onPageCreated')
    ;(await this.getBlocker()).enableBlockingInPage(page)
  }
}

export default (options: Partial<PluginOptions> = {}) => {
  return new PuppeteerExtraPluginAdblocker(options)
}
