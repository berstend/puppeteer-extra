import { Server as ProxyServer, RequestError, redactUrl } from 'proxy-chain'
import type * as ProxyChain from 'proxy-chain'

import getPort from './utils/port'

import { ProxyRouterStats } from './stats'

import Debug from 'debug'

const debug = Debug('puppeteer-extra:proxy-router')
const debugVerbose = debug.extend('verbose')
const warn = console.warn.bind(console, `\n[proxy-router] %s`) // Preserves line numbers

type ProxyServerOpts = ConstructorParameters<typeof ProxyServer>[0]

export interface Proxies {
  /** The default proxy for the browser (format: `http://user:pass@proxyhost:port`), if omitted or `null` no proxy will be used by default */
  DEFAULT?: string | null
  /** Any other custom proxy names which can be used for routing later (e.g. `'DATACENTER_US': 'http://user:pass@proxyhost:port'`) */
  [key: string]: string | null
}

export type ProxyName = 'DIRECT' | 'DEFAULT' | 'ABORT' | string

/** Data available to the `routeByHost` function */
export interface RouteByHostArgs {
  /** Request URL host */
  host: string
  /** Whether the request is http or not */
  isHttp: boolean
  /** Request port (typically 443 or 80) */
  port: number
}
export type RouteByHostResponse = ProxyName | void
export type RouteByHostFn = (
  args: RouteByHostArgs
) => Promise<RouteByHostResponse>

export interface ProxyRouterOpts {
  /**
   * A dictionary of proxies to be made available to the browser and router.
   *
   * An optional entry named `DEFAULT` will be used for all requests, unless overriden by `routeByHost`.
   * If the `DEFAULT` entry is omitted no proxy will be used by default.
   *
   * The value of an entry can be a string (format: `http://user:pass@proxyhost:port`) or `null` (direct connection).
   * Proxy authentication is handled automatically by the router.
   *
   * @example
   * proxies: {
   *   DEFAULT: "http://user:pass@proxyhost:port", // use this proxy by default
   *   RESIDENTIAL_US: "http://user:pass@proxyhost2:port" // use this for specific hosts with `routeByHost`
   * }
   */
  proxies?: Proxies

  /**
   * An optional function to allow proxy routing based on the target host of the request.
   *
   * A return value of nothing, `null` or `DEFAULT` will result in the DEFAULT proxy being used as configured.
   * A return value of `DIRECT` will result in no proxy being used.
   * A return value of `ABORT` will cancel/block this request.
   *
   * Any other string as return value is assumed to be a reference to the configured `proxies` dict.
   *
   * @note The browser will most often establish only a single proxy connection per host.
   *
   * @example
   * routeByHost: async ({ host }) => {
   *   if (host.includes('google')) { return "DIRECT" }
   *   return 'RESIDENTIAL_US'
   * }
   *
   */
  routeByHost?: RouteByHostFn
  /** Collect traffic and connection stats, default: true */
  collectStats?: boolean
  /** Don't print any proxy connection errors to stderr, default: false */
  muteProxyErrors?: boolean
  /** Suppress proxy errors for specific hosts */
  muteProxyErrorsForHost?: string[]
  /** Options for the local proxy-chain server  */
  proxyServerOpts?: ProxyServerOpts
}

export class ProxyRouter {
  /** The underlying local proxy server used for routing to upstream proxies */
  public proxyServer: ProxyChain.Server
  /** An optional function to route hosts  */
  public routeByHost: RouteByHostFn | null
  /**
   * The dictionary of proxies made available (format: `FOOBAR: 'http://user:pass@proxyhost:port'`).
   * Can be modified at runtime.
   */
  public proxies: Proxies
  /** Traffic stats collector */
  public readonly stats: ProxyRouterStats

  public isListening: boolean = false
  protected serverStartPromise: Promise<number> | null
  protected collectStats: boolean
  protected muteProxyErrors: boolean
  protected muteProxyErrorsForHost: string[]
  /** Internal list of failed connections to only print the same connection issue once */
  protected failedConnections: { host: string; proxy: string }[] = []

  constructor(opts: ProxyRouterOpts = {}) {
    const proxyServerOpts: ProxyServerOpts = {
      ...opts.proxyServerOpts,
      prepareRequestFunction: this.handleProxyServerRequest.bind(this),
    }
    proxyServerOpts.port = proxyServerOpts.port || 2800

    this.proxies = opts.proxies || {}

    this.routeByHost = opts.routeByHost || null
    this.proxyServer = new ProxyServer(proxyServerOpts)
    this.collectStats = opts.collectStats ?? true
    this.stats = new ProxyRouterStats(this.proxyServer)

    this.muteProxyErrors = opts.muteProxyErrors ?? false
    this.muteProxyErrorsForHost = opts.muteProxyErrorsForHost || []

    debug('initialized', opts)

    // Emitted when HTTP connection is closed
    this.proxyServer.on('connectionClosed', ({ connectionId, stats }) => {
      if (stats && this.collectStats) {
        this.stats.addStats(connectionId as number, stats)
      }
      debugVerbose(`Connection ${connectionId} closed`)
    })

    // Emitted when a HTTP request fails
    this.proxyServer.on('requestFailed', ({ request, error }) => {
      if (!this.muteProxyErrors) {
        warn('Request failed:', request.url, error)
      }
    })

    // Emitted in case of a upstream proxy error (which can mean various things)
    this.proxyServer.on(
      'proxyAuthenticationFailed',
      ({
        connectionId,
        str: errorStr,
      }: {
        connectionId: unknown
        str: string
      }) => {
        // resolve the affected host and proxy
        const { host, proxy } =
          this.stats.connectionLog.find(({ id }) => id === connectionId) || {}
        const proxyUrl = !!proxy ? this.getProxyForName(proxy) : null

        const info: string[] = [errorStr]
        info.push(
          "This error can be thrown if a resource on a site simply can't be accessed (often temporarily), in this case this can be ignored.",
          ` - To not have errors like this printed to the console you can set 'muteProxyErrors: true' ${
            !!host ? `or 'muteProxyErrorsForHost: ["${host}"]'` : ''
          }`,
          'It can also indicate incorrect proxy credentials or that the target host is blocked by the proxy.',
          ' - Make sure the provided proxy string and credentials are correct and the site is not blocked by the proxy (or vice versa).',
          " - In case the site is blocked by the proxy: Use 'routeByHost' to route the host through a different proxy or as 'DIRECT' or 'ABORT'."
        )
        if (host && proxy) {
          info.push(
            '',
            `Affected target host: "${host}"`,
            `Affected proxy name: "${proxy}"`
          )
        }
        if (proxyUrl) {
          info.push(`Affected proxy URL: "${proxyUrl}"`)
          info.push(
            '',
            `To test the proxy with curl: curl -v --proxy '${proxyUrl}' 'https://${host}'`,
            ''
          )
          if (!`${proxyUrl}`.includes('http://')) {
            info.push('PS: Did you forget to prefix the proxy with "http://"?')
          }
        }
        const probablyNoise =
          errorStr.includes('authenticate') && errorStr.includes('522')
        const isMuted =
          this.muteProxyErrors || this.muteProxyErrorsForHost.includes(host)
        const alreadySeen = !!this.failedConnections.find(
          (entry) => entry.host === host && entry.proxy === proxy
        )
        const logger = probablyNoise || isMuted || alreadySeen ? debug : warn
        logger(info.join('\n'))
        if (host && proxy) {
          this.failedConnections.push({ host, proxy })
        }
      }
    )

    // Resurface some errors that proxy-chain seems to swallow
    this.proxyServer.log = (function (originalMethod, context) {
      return function (connectionId: unknown, str: string) {
        if (`${str}`.includes('Failed to authenticate upstream proxy')) {
          context.emit('proxyAuthenticationFailed', {
            connectionId,
            str,
          })
        }
        if (`${str}`.includes('Error: Invalid "upstreamProxyUrl" provided')) {
          context.emit('proxyAuthenticationFailed', {
            connectionId,
            str,
          })
        }
        if (`${str}`.includes('Failed to connect to upstream proxy')) {
          context.emit('proxyAuthenticationFailed', {
            connectionId,
            str,
          })
        }
        originalMethod.apply(context, [connectionId, str])
      }
    })(this.proxyServer.log, this.proxyServer)
  }

  /** Proxy server URL of the local proxy server used for routing */
  public get proxyServerUrl() {
    const port = this.proxyServer?.port
    if (!port || !this.isListening) {
      return
    }
    return `http://localhost:${port}`
  }

  public get effectiveProxies() {
    return {
      DIRECT: null,
      ...(this.proxies || {}),
    }
  }

  /** Start the local proxy server and accept connections */
  public async listen(): Promise<number> {
    debug('starting server..')
    if (this.serverStartPromise) {
      debug('server start promise exists already')
      return this.serverStartPromise
    }
    this.serverStartPromise = new Promise(async (resolve) => {
      if (this.isListening) {
        debug('server listening already')
        return resolve(this.proxyServer.port)
      }
      const desiredPort = this.proxyServer.port
      debug('finding available port', { desiredPort })
      const availablePort = await getPort({ port: desiredPort })
      debug('availablePort:', availablePort)
      this.proxyServer.port = availablePort
      this.proxyServer.listen((err) => {
        if (err === null) {
          debug(`server listening on port ${this.proxyServer.port}`)
          this.isListening = true
          return resolve(this.proxyServer.port)
        }
        warn('Unable to start local server:', err)
      })
    })
    return this.serverStartPromise
  }

  /** Stop the local proxy server */
  public async close(): Promise<NodeJS.ErrnoException | null> {
    debug('closing..')
    return new Promise((resolve) => {
      this.proxyServer.close(true, (err) => {
        if (err === null) {
          debug('closed without error')
          return resolve(null)
        }
        debug('closed with error', err)
        return resolve(err)
      })
    })
  }

  public getProxyForName(name: ProxyName): string | null {
    return this.effectiveProxies[name]
  }

  /** Handle requests to the proxy server */
  protected async handleProxyServerRequest({
    request,
    hostname: host,
    port,
    connectionId,
    isHttp,
  }: ProxyChain.PrepareRequestFunctionOpts): Promise<void | ProxyChain.PrepareRequestFunctionResult> {
    let proxyName = 'DEFAULT'
    if (!!this.routeByHost) {
      const fnResult = await this.routeByHost({ host, isHttp, port })
      if (typeof fnResult === 'string' && !!fnResult) {
        proxyName = fnResult
      }
    }
    if (this.collectStats) {
      this.stats.addConnection(connectionId, proxyName, host)
    }
    let proxyUrl = this.getProxyForName(proxyName)
    debugVerbose(
      'handleProxyServerRequest',
      host,
      proxyName,
      redactProxyUrl(proxyUrl)
    )
    if (proxyName === 'ABORT') {
      throw new RequestError('Request aborted', 400)
    }
    if (!proxyUrl && proxyUrl !== null) {
      warn(
        `No proxy configured for proxy name "${proxyName}" - configuration error?`
      )
      proxyUrl = null
    }
    return {
      upstreamProxyUrl: proxyUrl,
    }
  }
}

function redactProxyUrl(input: unknown) {
  if (!input || typeof input !== 'string') {
    return `${input}`
  }
  try {
    return redactUrl(input)
  } catch (err) {
    return `${input}`
  }
}

/** Standalone proxy router not requiring plugin events */
export const ProxyRouterStandalone = ProxyRouter
