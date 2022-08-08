import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import { ProxyRouter, ProxyRouterOpts } from './router'

export type ExtraPluginProxyRouterOptions = ProxyRouterOpts & {
  /**
   * Optionally exempt hosts from going through a proxy, even our internal routing proxy.
   *
   * Examples:
   * `.com` or `chromium.org` or `.domain.com`
   *
   * @see
   * https://chromium.googlesource.com/chromium/src/+/HEAD/net/docs/proxy.md#proxy-bypass-rules
   * https://www-archive.mozilla.org/quality/networking/docs/aboutno_proxy_for.html
   */
  proxyBypassList?: string[]
}

export class ExtraPluginProxyRouter extends PuppeteerExtraPlugin {
  /** The underlying proxy router instance */
  public router: ProxyRouter
  /** The name of the automation framework used */
  public framework: 'playwright' | 'puppeteer' | null = null
  // Disable the puppeteer compat shim when used with playwright-extra
  public noPuppeteerShim = true

  constructor(opts: Partial<ExtraPluginProxyRouterOptions>) {
    super(opts)
    this.debug('Initialized', this.opts)
    this.router = new ProxyRouter(this.opts)
  }

  get name() {
    return 'proxy-router'
  }

  get defaults(): ExtraPluginProxyRouterOptions {
    return {
      collectStats: true,
      proxyServerOpts: {
        port: 2800,
      },
    }
  }

  // Make accessing router methods shorter
  /** Get or set proxies at runtime */
  public get proxies() {
    return this.router.proxies
  }
  public set proxies(proxies) {
    this.router.proxies = proxies
  }

  /** Retrieve traffic statistics */
  public get stats() {
    return this.router.stats
  }

  /** Get or set the `routeByHost` function at runtime */
  public get routeByHost() {
    return this.router.routeByHost
  }
  public set routeByHost(fn) {
    this.router.routeByHost = fn
  }

  private get proxyBypassListString() {
    return (this.opts.proxyBypassList || []).join(',') || undefined
  }

  async onPluginRegistered(args?: { framework: 'playwright' }): Promise<void> {
    this.framework =
      args?.framework === 'playwright' ? 'playwright' : 'puppeteer'
    this.debug('plugin registered', this.framework)
  }

  async beforeLaunch(options: unknown = {}): Promise<void> {
    this.debug('beforeLaunch - before', options)
    await this.router.listen()

    const proxyUrl = this.router.proxyServerUrl
    if (!proxyUrl) {
      throw new Error('No local proxy server available')
    }

    if (this.framework === 'playwright') {
      const pwOptions = options as PlaywrightLaunchOptions
      pwOptions.proxy = {
        server: proxyUrl,
        bypass: this.proxyBypassListString,
      }
    } else if (this.framework === 'puppeteer') {
      const pptrOptions = options as PuppeteerLaunchOptions
      pptrOptions.args = pptrOptions.args || []
      pptrOptions.args.push(`--proxy-server=${proxyUrl}`)
      if (this.proxyBypassListString) {
        pptrOptions.args.push(
          `--proxy-bypass-list=${this.proxyBypassListString}`
        )
      }
    } else {
      this.debug('Unsupported framework, not setting proxy')
    }
    this.debug('beforeLaunch - after', options)
  }

  async onDisconnected(): Promise<void> {
    await this.router.close().catch(this.debug)
  }
}

interface PuppeteerLaunchOptions {
  args?: string[]
}

interface PlaywrightLaunchOptions {
  proxy?: {
    /**
     * Proxy to be used for all requests. HTTP and SOCKS proxies are supported, for example `http://myproxy.com:3128` or
     * `socks5://myproxy.com:3128`. Short form `myproxy.com:3128` is considered an HTTP proxy.
     */
    server: string

    /**
     * Optional comma-separated domains to bypass proxy, for example `".com, chromium.org, .domain.com"`.
     */
    bypass?: string
  }
}
