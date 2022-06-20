import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import { ResourceType } from 'puppeteer'

declare interface PluginOptions {
  availableTypes?: Set<ResourceType>
  blockedTypes?: Set<ResourceType>
  interceptResolutionPriority?: number
}

declare class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Partial<PluginOptions>)
  get name(): string
  get defaults(): PluginOptions
  get engineCacheFile(): string
  get availableTypes(): Set<ResourceType>
  get blockedTypes(): Set<ResourceType>
  get interceptResolutionPriority(): number
}

declare const _default: (options?: Partial<PluginOptions>) => Plugin

export default _default
