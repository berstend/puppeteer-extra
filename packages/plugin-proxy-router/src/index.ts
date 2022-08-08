import { ExtraPluginProxyRouter, ExtraPluginProxyRouterOptions } from './plugin'

export * from './plugin'
export * from './router'
export * from './stats'

/** Default export, ExtraPluginProxyRouter  */
const defaultExport = (options?: Partial<ExtraPluginProxyRouterOptions>) => {
  return new ExtraPluginProxyRouter(options || {})
}

export default defaultExport
