import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

export class DummyPlugin extends PuppeteerExtraPlugin {
  public pluginEventList: string[] = []
  public pluginEventMap: Map<string, any> = new Map()

  constructor(opts = {}) {
    super(opts)
  }
  get name() {
    return 'dummy'
  }

  async onPluginRegistered(...args: any[]) {
    this.pluginEventList.push('onPluginRegistered')
  }
  async beforeLaunch(...args: any[]) {
    this.pluginEventList.push('beforeLaunch')
  }
  async afterLaunch(...args: any[]) {
    this.pluginEventList.push('afterLaunch')
  }
  async beforeConnect(...args: any[]) {
    this.pluginEventList.push('beforeConnect')
  }
  async afterConnect(...args: any[]) {
    this.pluginEventList.push('afterConnect')
  }
  async onBrowser(...args: any[]) {
    this.pluginEventList.push('onBrowser')
  }
  async onTargetCreated(...args: any[]) {
    this.pluginEventList.push('onTargetCreated')
  }
  async onPageCreated(...args: any[]) {
    this.pluginEventList.push('onPageCreated')
  }
  async onTargetChanged(...args: any[]) {
    this.pluginEventList.push('onTargetChanged')
  }
  async onTargetDestroyed(...args: any[]) {
    this.pluginEventList.push('onTargetDestroyed')
  }
  async onDisconnected(...args: any[]) {
    this.pluginEventList.push('onDisconnected')
  }
  async onClose(...args: any[]) {
    this.pluginEventList.push('onClose')
  }

  // playwright only at the moment
  async beforeContext(...args: any[]) {
    this.pluginEventList.push('beforeContext')
  }
  async onContextCreated(...args: any[]) {
    this.pluginEventList.push('onContextCreated')
  }
}
