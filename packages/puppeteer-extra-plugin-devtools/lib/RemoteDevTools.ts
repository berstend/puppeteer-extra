'use strict'

import Debug from 'debug'
import ow from 'ow'

import got from 'got'
import http from 'http'
import httpProxy from 'http-proxy'
import localtunnel from 'localtunnel'

import httpAuth, { basic } from 'http-auth'
import getPort from 'get-port'
import randomstring from 'randomstring'
import urlParse from 'url-parse'

const modifyResponse = require('http-proxy-response-rewrite')

const debug = Debug('remote-devtools')
type Basic = ReturnType<typeof basic>


export interface DevToolsTunnelOptions {
  prefix: string;
  subdomain: string | null;
  auth: { user: string | null, pass: string | null };
  localtunnel: any;
}

/**
 * Base class handling common stuff
 *
 * @ignore
 */
export class DevToolsCommon {
  public opts: DevToolsTunnelOptions
  public wsUrl: string
  public wsHost: string
  public wsPort: string

  constructor(webSocketDebuggerUrl: string, opts: Partial<DevToolsTunnelOptions> = {}) {
    ow(webSocketDebuggerUrl, ow.string)
    ow(webSocketDebuggerUrl, ow.string.includes('ws://'))
    ow(opts, ow.object.plain)
    this.opts = opts as DevToolsTunnelOptions

    this.wsUrl = webSocketDebuggerUrl
    const wsUrlParts = urlParse(this.wsUrl)
    this.wsHost =
      wsUrlParts.hostname === '127.0.0.1' ? 'localhost' : wsUrlParts.hostname
    this.wsPort = wsUrlParts.port
  }

  async fetchVersion(): Promise<any> {
    const { body } = await got(
      `http://${this.wsHost}:${this.wsPort}/json/version`,
      {
        json: true
      }
    )
    return body
  }

  async fetchList(): Promise<any> {
    const { body } = await got(
      `http://${this.wsHost}:${this.wsPort}/json/list`,
      { json: true }
    )
    return body
  }
}

/**
 * Convenience functions for local remote debugging sessions.
 *
 * @ignore
 */
export class DevToolsLocal extends DevToolsCommon {
  constructor(webSocketDebuggerUrl: string, opts = {}) {
    super(webSocketDebuggerUrl, opts)
  }

  get url(): string {
    return `http://${this.wsHost}:${this.wsPort}`
  }

  getUrlForPageId(pageId: string) {
    return `${this.url}/devtools/inspector.html?ws=${this.wsHost}:${this.wsPort}/devtools/page/${pageId}`
  }
}

export interface DevToolsTunnelOptions {
  prefix: string;
  subdomain: string | null;
  auth: { user: string | null, pass: string | null };
  localtunnel: any;
}

/**
 * Create a proxy + tunnel to make a local devTools session accessible from the internet.
 *
 * - These devtools pages support screencasting the browser screen
 * - Proxy supports both http and websockets
 * - Proxy patches Host header to bypass devtools bug preventing non-localhost/ip access
 * - Proxy rewrites URLs, so links on the devtools index page will work
 * - Has a convenience function to return a deep link to a debug a specific page
 * - Supports basic auth ;-)
 *
 * @todo No idea how long-living a tunnel connection is yet, we might want to add keep-alive/reconnect capabilities
 *
 * @ignore
 */
export class DevToolsTunnel extends DevToolsCommon {
  server: any;
  tunnel: any;
  tunnelHost: any;
  proxyServer: any;

  constructor(webSocketDebuggerUrl: string, opts = {} as Partial<DevToolsTunnelOptions>) {
    super(webSocketDebuggerUrl, opts)

    this.server = null
    this.tunnel = {}
    this.tunnelHost = null

    this.opts = Object.assign(this.defaults, opts)
  }

  get defaults(): DevToolsTunnelOptions {
    return {
      prefix: 'devtools-tunnel',
      subdomain: null,
      auth: { user: null, pass: null },
      localtunnel: {}
    }
  }

  get url(): string {
    return this.tunnel.url
  }

  getUrlForPageId(pageId: string) {
    return `https://${this.tunnelHost}/devtools/inspector.html?wss=${this.tunnelHost}/devtools/page/${pageId}`
  }

  async create(): Promise<this> {
    const subdomain =
      this.opts.subdomain || this._generateSubdomain(this.opts.prefix)
    const basicAuth = this.opts.auth.user
      ? this._createBasicAuth(this.opts.auth.user, this.opts.auth.pass || '')
      : null
    const serverPort = await getPort() // only preference, will return an available one

    this.proxyServer = this._createProxyServer(this.wsHost, this.wsPort)
    this.server = await this._createServer(serverPort, basicAuth)
    this.tunnel = await this._createTunnel({
      local_host: this.wsHost,
      port: serverPort,
      subdomain,
      ...this.opts.localtunnel
    })

    this.tunnelHost = urlParse(this.tunnel.url).hostname

    debug(
      'tunnel created.',
      `
      local:  http://${this.wsHost}:${this.wsPort}
      proxy:  http://localhost:${serverPort}
      tunnel: ${this.tunnel.url}
    `
    )
    return this
  }

  close(): this {
    this.tunnel.close()
    this.server.close()
    this.proxyServer.close()
    debug('all closed')
    return this
  }

  _generateSubdomain(prefix: string): string {
    const rand = randomstring.generate({
      length: 10,
      readable: true,
      capitalization: 'lowercase'
    })
    return `${prefix}-${rand}`
  }

  _createBasicAuth(user: string, pass: string): Basic {
    const basicAuth = httpAuth.basic({}, (username, password, callback) => {
      const isValid = username === user && password === pass
      return callback(isValid)
    })
    basicAuth.on('fail', (result) => {
      debug(`User authentication failed: ${result.user}`)
    })
    basicAuth.on('error', (error) => {
      debug(`Authentication error: ${(error as any).code + ' - ' + error.message}`)
    })
    return basicAuth
  }

  /**
   * `fetch` used by the index page doesn't include credentials by default.
   *
   *           LOVELY
   *           THANKS
   *             <3
   *
   * @ignore
   */
  _modifyFetchToIncludeCredentials(body: string) {
    if (!body) {
      return
    }
    body = body.replace(`fetch(url).`, `fetch(url, {credentials: 'include'}).`)

    // Fix for headless index pages that use weird client-side JS to modify the devtoolsFrontendUrl to something not working for us
    // https://github.com/berstend/puppeteer-extra/issues/566
    body = body.replace(
      'link.href = `https://chrome-devtools-frontend.appspot.com',
      'link.href = item.devtoolsFrontendUrl; // '
    )

    debug('fetch:after', body)
    return body
  }

  _modifyJSONResponse(body: string) {
    if (!body) {
      return
    }
    debug('list body:before', body)
    body = body.replace(new RegExp(this.wsHost, 'g'), `${this.tunnelHost}`)
    body = body.replace(new RegExp('ws=', 'g'), 'wss=')
    body = body.replace(new RegExp('ws://', 'g'), 'wss://')
    debug('list body:after', body)
    return body
  }

  _createProxyServer(targetHost = 'localhost', targetPort: string) {
    // eslint-disable-next-line
    const proxyServer = httpProxy.createProxyServer({
      // eslint-disable-line
      target: { host: targetHost, port: parseInt(targetPort) }
    })
    proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
      debug('proxyReq', req.url)
      // https://github.com/GoogleChrome/puppeteer/issues/2242
      proxyReq.setHeader('Host', 'localhost')
    })
    proxyServer.on('proxyRes', (proxyRes, req, res) => {
      debug('proxyRes', req.url)
      if (req.url === '/') {
        delete proxyRes.headers['content-length']
        modifyResponse(
          res,
          proxyRes.headers['content-encoding'],
          this._modifyFetchToIncludeCredentials.bind(this)
        )
      }
      if (['/json/list', '/json/version'].includes(req.url as string)) {
        delete proxyRes.headers['content-length']
        modifyResponse(
          res,
          proxyRes.headers['content-encoding'],
          this._modifyJSONResponse.bind(this)
        )
      }
    })
    return proxyServer
  }

  async _createServer(port: string | number, auth: any = null) {
    const server = http.createServer(auth, (req, res) => {
      this.proxyServer.web(req, res)
    })
    server.on('upgrade', (req, socket, head) => {
      debug('upgrade request', req.url)
      this.proxyServer.ws(req, socket, head)
    })
    server.listen(port)
    return server
  }

  async _createTunnel(options: number | localtunnel.TunnelConfig & { port: number }) {
    const tunnel = await localtunnel(options)

    tunnel.on('close', () => {
      // todo: add keep-alive?
      debug('tunnel:close')
    })

    tunnel.on('error', err => {
      console.log('tunnel error', err)
    })

    debug('tunnel:created', tunnel.url)
    return tunnel
  }
}
