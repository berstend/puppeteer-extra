import net from 'net'

export interface Options {
  /**
   * A preferred port or an array of preferred ports to use.
   */
  port?: number | ReadonlyArray<number>

  /**
   * The host on which port resolution should be performed. Can be either an IPv4 or IPv6 address.
   */
  host?: string
}

const isAvailable = (options: Options): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(options, () => {
      const { port } = server.address() as any
      server.close(() => {
        resolve(port as number)
      })
    })
  })

const getPort = (options: Options) => {
  options = Object.assign({}, options)

  if (typeof options.port === 'number') {
    options.port = [options.port]
  }

  return (options.port || []).reduce(
    (seq, port) =>
      seq.catch(() => isAvailable(Object.assign({}, options, { port }))),
    Promise.reject()
  )
}

export default (options?: Options) =>
  options
    ? getPort(options).catch(() => getPort(Object.assign(options, { port: 0 })))
    : getPort({ port: 0 })
