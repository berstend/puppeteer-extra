import type * as pw from 'playwright-core'

/** Node.js module loader helper */
export class Loader<TargetModule> {
  constructor(public moduleName: string, public packageNames: string[]) {}

  /**
   * Lazy load a top level export from another module by wrapping it in a JS proxy.
   *
   * This allows us to re-export e.g. `devices` from `playwright` while redirecting direct calls
   * to it to the module version the user has installed, rather than shipping with a hardcoded version.
   *
   * If we don't do this and the user doesn't have the target module installed we'd throw immediately when our code is imported.
   *
   * We use a "super" Proxy defining all traps, so calls like `Object.keys(playwright.devices).length` will return the correct value.
   */
  public lazyloadExportOrDie<T extends keyof TargetModule>(exportName: T) {
    const that = this
    const trapHandler = Object.fromEntries(
      Object.getOwnPropertyNames(Reflect).map((name: any) => [
        name,
        function (target: any, ...args: any[]) {
          const moduleExport = that.loadModuleOrDie()[exportName]
          const customTarget = moduleExport as any
          const result = ((Reflect as any)[name] as any)(
            customTarget || target,
            ...args
          )
          return result
        }
      ])
    )
    return new Proxy({}, trapHandler) as TargetModule[T]
  }

  /** Load the module if possible */
  public loadModule() {
    return requirePackages<TargetModule>(this.packageNames)
  }

  /** Load the module if possible or throw */
  public loadModuleOrDie(): TargetModule {
    const module = requirePackages<TargetModule>(this.packageNames)
    if (module) {
      return module
    }
    throw this.requireError
  }

  public get requireError() {
    const moduleNamePretty =
      this.moduleName.charAt(0).toUpperCase() + this.moduleName.slice(1)
    return new Error(`
  ${moduleNamePretty} is missing. :-)

  I've tried loading ${this.packageNames
    .map(p => `"${p}"`)
    .join(', ')} - no luck.

  Make sure you install one of those packages or use the named 'addExtra' export,
  to patch a specific (and maybe non-standard) implementation of ${moduleNamePretty}.

  To get the latest stable version of ${moduleNamePretty} run:
  'yarn add ${this.moduleName}' or 'npm i ${this.moduleName}'
  `)
  }
}

export function requirePackages<TargetModule = any>(packageNames: string[]) {
  for (const name of packageNames) {
    try {
      return require(name) as TargetModule
    } catch (_) {
      continue // noop
    }
  }
  return
}

/** Playwright specific module loader */
export const playwrightLoader = new Loader<typeof pw>('playwright', [
  'playwright-core',
  'playwright'
])
