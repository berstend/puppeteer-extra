import type * as pptr from 'puppeteer'

// Extend puppeteer to add types which are not exposed
declare module 'puppeteer' {
  export interface Browser {
    _createPageInContext: (contextId?: string) => Promise<pptr.Page>
  }
}
