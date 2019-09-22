import { promises as fs } from 'fs';
import path from 'path';

import { PuppeteerBlocker } from '@cliqz/adblocker-puppeteer'
import mkdirp from 'mkdirp';
import fetch from 'node-fetch';
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

import { PluginOptions } from './types'

/**
 * A puppeteer-extra plugin to automatically block ads and trackers.
 */
export class PuppeteerExtraPluginAdblocker extends PuppeteerExtraPlugin {
  private blocker: PuppeteerBlocker | undefined

  constructor (opts: Partial<PluginOptions>) {
    super(opts)
    this.debug('Initialized', this.opts)
  }

  get name () {
    return 'adblocker'
  }

  get defaults (): PluginOptions {
    return {
      blockTrackers: false,
      cacheDir: undefined
    }
  }

  /**
   * Resolve when adblocker is ready to block ads. This means that
   * `this.blocker` was initialized either from cache or remote (see:
   * `getBlocker`).
   */
  async ready (): Promise<void> {
    await this.getBlocker();
  }

  /**
   * Cache an instance of `PuppeteerBlocker` to disk if 'cacheDir' option was
   * specified for the plugin. It can then be used the next time this plugin is
   * used to load the adblocker faster.
   */
  private async persistToCache (blocker: PuppeteerBlocker): Promise<void> {
    if (this.opts.cacheDir !== undefined) {
      this.debug('persist to cache')
      await new Promise(resolve => mkdirp(this.opts.cacheDir, resolve));
      await fs.writeFile(path.join(this.opts.cacheDir, 'engine.bin'), blocker.serialize());
    }
  }

  /**
   * Initialize instance of `PuppeteerBlocker` from cache if possible.
   * Otherwise, it throws and we will try to initialize it from remote instead.
   */
  private async loadFromCache (): Promise<PuppeteerBlocker> {
    if (this.opts.cacheDir === undefined) {
      throw new Error('caching disabled');
    }

    this.debug('load from cache')
    return PuppeteerBlocker.deserialize(
      new Uint8Array(await fs.readFile(path.join(this.opts.cacheDir, 'engine.bin')))
    );
  }

  /**
   * Initialize instance of `PuppeteerBlocker` from remote (either by fetching
   * a serialized version of the engine when available, or by downloading raw
   * lists for filters such as EasyList then parsing them to initialize
   * blocker).
   */
  private async loadFromRemote (): Promise<PuppeteerBlocker> {
    this.debug('load from remote')
    if (this.opts.blockTrackers === true) {
      return PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
    } else {
      return PuppeteerBlocker.fromPrebuiltAdsOnly(fetch);
    }
  }

  /**
   * Return instance of `PuppeteerBlocker`. It will take care of initializing
   * it if necessary (first time it is called), or return the existing instance
   * if it already exists.
   */
  async getBlocker (): Promise<PuppeteerBlocker> {
    if (this.blocker === undefined) {
      try {
        this.blocker = await this.loadFromCache();
      } catch (ex) {
        this.blocker = await this.loadFromRemote();
        await this.persistToCache(this.blocker);
      }
    }

    return this.blocker;
  }

  /**
   * Enable adblocking in `page`.
   */
  async onPageCreated (page: any) {
    this.debug('onPageCreated');
    (await this.getBlocker()).enableBlockingInPage(page)
  }
}

export default (options: Partial<PluginOptions> = {}) => {
  return new PuppeteerExtraPluginAdblocker(options)
}
