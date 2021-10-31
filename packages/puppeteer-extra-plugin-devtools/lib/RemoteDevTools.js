'use strict'

const debug = require('debug')('remote-devtools')
const ow = require('ow')

const got = require('got')
const http = require('http')
const httpProxy = require('http-proxy')
const localtunnel = require('localtunnel')

const httpAuth = require('http-auth')
const modifyResponse = require('http-proxy-response-rewrite')
const getPort = require('get-port')
const randomstring = require('randomstring')
const urlParse = require('url-parse')

/**
 * Base class handling common stuff
 *
 * @ignore
 */
class DevToolsCommon {
  constructor(webSocketDebuggerUrl, opts = {}) {
    ow(webSocketDebuggerUrl, ow.string)
    ow(webSocketDebuggerUrl, ow.string.includes('ws://'))
    ow(opts, ow.object.plain)
    this.opts = opts

    this.wsUrl = webSocketDebuggerUrl
    const wsUrlParts = urlParse(this.wsUrl)
    this.wsHost =
      wsUrlParts.hostname === '127.0.0.1' ? 'localhost' : wsUrlParts.hostname
    this.wsPort = wsUrlParts.port
  }

  async fetchVersion() {
    const { body } = await got(
      `http://${this.wsHost}:${this.wsPort}/json/version`,
      {
        json: true
      }
    )
    return body
  }

  async fetchList() {
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
class DevToolsLocal extends DevToolsCommon {
  constructor(webSocketDebuggerUrl, opts = {}) {
    super(webSocketDebuggerUrl, opts)
  }

  get url() {
    return `http://${this.wsHost}:${this.wsPort}`
  }

  getUrlForPageId(pageId) {
    return `${this.url}/devtools/inspector.html?ws=${this.wsHost}:${this.wsPort}/devtools/page/${pageId}`
  }
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
class DevToolsTunnel extends DevToolsCommon {
  constructor(webSocketDebuggerUrl, opts = {}) {
    super(webSocketDebuggerUrl, opts)

    this.server = null
    this.tunnel = {}
    this.tunnelHost = null

    this.opts = Object.assign(this.defaults, opts)
  }

  get defaults() {
    return {
      prefix: 'devtools-tunnel',
      subdomain: null,
      auth: { user: null, pass: null },
      localtunnel: {}
    }
  }

  get url() {
    return this.tunnel.url
  }

  getUrlForPageId(pageId) {
    return `https://${this.tunnelHost}/devtools/inspector.html?wss=${this.tunnelHost}/devtools/page/${pageId}`
  }

  async create() {
    const subdomain =
      this.opts.subdomain || this._generateSubdomain(this.opts.prefix)
    const basicAuth = this.opts.auth.user
      ? this._createBasicAuth(this.opts.auth.user, this.opts.auth.pass)
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

  close() {
    this.tunnel.close()
    this.server.close()
    this.proxyServer.close()
    debug('all closed')
    return this
  }

  _generateSubdomain(prefix) {
    const rand = randomstring.generate({
      length: 10,
      readable: true,
      capitalization: 'lowercase'
    })
    return `${prefix}-${rand}`
  }

  _createBasicAuth(user, pass) {
    const basicAuth = httpAuth.basic({}, (username, password, callback) => {
      const isValid = username === user && password === pass
      return callback(isValid)
    })
    basicAuth.on('fail', (result, req) => {
      debug(`User authentication failed: ${result.user}`)
    })
    basicAuth.on('error', (error, req) => {
      debug(`Authentication error: ${error.code + ' - ' + error.message}`)
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
  _modifyFetchToIncludeCredentials(body) {
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

  _modifyJSONResponse(body) {
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
  _createProxyServer(targetHost = 'localhost', targetPort) {
    // eslint-disable-next-line
    const proxyServer = new httpProxy.createProxyServer({
      // eslint-disable-line
      target: { host: targetHost, port: parseInt(targetPort) }
    })
    proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
      debug('proxyReq', req.url)
      // https://github.com/GoogleChrome/puppeteer/issues/2242
      proxyReq.setHeader('Host', 'localhost')
    })
    proxyServer.on('proxyRes', (proxyRes, req, res, options) => {
      debug('proxyRes', req.url)
      if (req.url === '/') {
        delete proxyRes.headers['content-length']
        modifyResponse(
          res,
          proxyRes.headers['content-encoding'],
          this._modifyFetchToIncludeCredentials.bind(this)
        )
      }
      if (['/json/list', '/json/version'].includes(req.url)) {
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

  async _createServer(port, auth = null) {
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

  async _createTunnel(options) {
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

module.exports = { DevToolsCommon, DevToolsLocal, DevToolsTunnel }
