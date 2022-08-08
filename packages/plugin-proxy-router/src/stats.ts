import type { Server as ProxyServer } from 'proxy-chain'

export interface ConnectionLogEntry {
  /** Connection Id */
  id: number
  /** Proxy name */
  proxy: string
  /** Host */
  host: string
}

export interface ConnectionStats {
  srcTxBytes: number
  srcRxBytes: number
  trgTxBytes: number
  trgRxBytes: number
}

export class ProxyRouterStats {
  /** Log of all connections (id, proxyName, host) */
  public connectionLog: ConnectionLogEntry[] = []
  protected connectionStats: Map<number, ConnectionStats> = new Map()

  constructor(private proxyServer: ProxyServer) {}

  /** @internal */
  public addConnection(id: number, proxy: string, host: string) {
    this.connectionLog.push({ id, proxy, host })
  }
  /** @internal */
  public addStats(connectionId: number, stats: ConnectionStats) {
    this.connectionStats.set(connectionId as number, stats)
  }

  /** Get bytes transferred by proxy */
  public get byProxy() {
    this.getStatsFromActiveConnections()
    // Get unique proxy names from our actual connection logs
    const proxyNames = Array.from(
      new Set(this.connectionLog.map(({ proxy }) => proxy))
    )
    const getConnectionIdsForProxy = (proxyName: string) =>
      this.connectionLog
        .filter(({ proxy }) => proxy === proxyName)
        .map(({ id }) => id)
    const trafficByProxy = Object.fromEntries(
      proxyNames
        .map((proxyName) => {
          const ids = getConnectionIdsForProxy(proxyName)
          const stats = ids.map((id) => this.connectionStats.get(id))
          const totalBytes = stats
            .map((stat) => this.calculateProxyBytes(stat))
            .reduce((a, b) => a + b)
          return [proxyName, totalBytes]
        })
        // Sort by most bytes on top
        .sort((a, b) => (b[1] as number) - (a[1] as number))
    )
    return trafficByProxy
  }

  /** Get bytes transferred by host */
  public get byHost() {
    this.getStatsFromActiveConnections()
    // Get unique proxy names from our actual connection logs
    const hostNames = Array.from(
      new Set(this.connectionLog.map(({ host }) => host))
    )
    const getConnectionIdsForHost = (hostName: string) =>
      this.connectionLog
        .filter(({ host }) => host === hostName)
        .map(({ id }) => id)
    const trafficByHost = Object.fromEntries(
      hostNames
        .map((hostName) => {
          const ids = getConnectionIdsForHost(hostName)
          const stats = ids.map((id) => this.connectionStats.get(id))
          const totalBytes = stats
            .map((stat) => this.calculateProxyBytes(stat))
            .reduce((a, b) => a + b)
          return [hostName, totalBytes]
        })
        // Sort by most bytes on top
        .sort((a, b) => (b[1] as number) - (a[1] as number))
    )
    return trafficByHost
  }

  protected getStatsFromActiveConnections() {
    // collect stats for active connections
    this.proxyServer.getConnectionIds().forEach((connectionId) => {
      const stats = this.proxyServer.getConnectionStats(connectionId)
      if (stats) {
        this.connectionStats.set(connectionId as number, stats)
      }
    })
  }

  protected calculateProxyBytes(stats?: Partial<ConnectionStats>) {
    if (!stats) {
      return 0
    }
    return (stats.trgRxBytes || 0) + (stats.trgTxBytes || 0)
  }
}
